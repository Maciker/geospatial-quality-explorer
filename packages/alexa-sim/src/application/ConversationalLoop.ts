import type { QualityToolsPort } from "../../../alexa-tools/src/application/QualityToolsPort.js";
import type {
  ExportQgisOutput,
  FindingSummary,
  ListFindingsOutput,
  RunValidationOutput,
} from "../../../alexa-tools/src/domain/toolContracts.js";
import type {
  AlexaSimChatRequest,
  AlexaSimChatResponse,
  ChatMessage,
  CitedFindingCard,
  QgisExportArtifact,
} from "../domain/chatTypes.js";
import { NEUTRAL_EMPTY_REPLY_FALLBACK } from "./assistantFallbacks.js";
import {
  assistantClaimsAreGrounded,
  collectCitationIdsFromFindings,
  mergeCitationIds,
  refusalTextForMissingCitation,
} from "./citationPolicy.js";
import { executeAlexaTool } from "./executeAlexaTool.js";
import { findingSummariesToCards, mergeFindingCards } from "./extractFindingCards.js";
import type { LlmCompletionResponse, LlmPort, LlmToolChoice } from "./LlmPort.js";
import { computeRoundBudgetMs } from "./llmTurnBudget.js";
import { ALEXA_QUALITY_TOOL_DEFINITIONS } from "./openAiToolDefinitions.js";
import { describeLlmStep } from "./llmStepLabel.js";
import {
  compactToolResultForModel,
  readVoiceAnswerFromCompactPayload,
  sessionContextMessage,
  trimTranscriptForModel,
} from "./modelPayload.js";
import { forcedToolForTurn, toolChoiceForTurn } from "./orchestrationToolChoice.js";
import { ALEXA_SIM_SYSTEM_INSTRUCTIONS } from "./systemInstructions.js";

export type ConversationalLoopOptions = {
  readonly tools: QualityToolsPort;
  readonly llm: LlmPort;
  readonly maxToolRounds?: number;
  /** Whole-request budget (sum of rounds, capped per round). */
  readonly timeoutMs?: number;
  readonly roundTimeoutMs?: number;
};

type LoopProgress = { sessionId: string; runId: string | null };

const DEFAULT_MAX_TOOL_ROUNDS = 4;
const DEFAULT_ROUND_TIMEOUT_MS = 24_000;

export class ConversationalLoop {
  private readonly tools: QualityToolsPort;
  private readonly llm: LlmPort;
  private readonly maxToolRounds: number;
  private readonly timeoutMs: number;
  private readonly roundTimeoutMs: number;

  constructor(options: ConversationalLoopOptions) {
    this.tools = options.tools;
    this.llm = options.llm;
    this.maxToolRounds = options.maxToolRounds ?? DEFAULT_MAX_TOOL_ROUNDS;
    this.timeoutMs = options.timeoutMs ?? 45_000;
    this.roundTimeoutMs = options.roundTimeoutMs ?? DEFAULT_ROUND_TIMEOUT_MS;
  }

  async run(input: AlexaSimChatRequest): Promise<AlexaSimChatResponse> {
    const deadlineMs = Date.now() + this.timeoutMs;
    const progress: LoopProgress = { sessionId: input.sessionId ?? "", runId: null };
    try {
      return await this.runUntilDeadline(input, deadlineMs, progress);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return this.timeoutResponse(sessionIdFromProgress(progress, input), [], progress.runId, null, progress);
      }
      throw error;
    }
  }

  private async runUntilDeadline(input: AlexaSimChatRequest, deadlineMs: number, progress: LoopProgress): Promise<AlexaSimChatResponse> {
    let sessionId = input.sessionId ?? "";
    let findingCards: readonly CitedFindingCard[] = [];
    let runId: string | null = null;
    let qgisExport: QgisExportArtifact | null = null;
    let knownIds = collectCitationIdsFromFindings(findingCards);
    let synthesisAttempted = false;

    const snapshot = sessionId ? await this.tools.describeSession(sessionId) : null;
    if (snapshot) {
      runId = snapshot.runId;
      progress.runId = runId;
      knownIds = collectCitationIdsFromFindings(snapshot.prioritizedFindings);
    }
    const transcript: ChatMessage[] = [
      { role: "system", content: ALEXA_SIM_SYSTEM_INSTRUCTIONS },
      ...(snapshot ? [sessionContextMessage(snapshot)] : []),
      ...input.messages.filter((message) => message.role !== "system"),
    ];
    const reply = (assistantMessage: string, refused: boolean): AlexaSimChatResponse => ({
      sessionId,
      assistantMessage,
      findings: findingCards,
      runId,
      refused,
      qgisExport,
    });

    for (let round = 0; round < this.maxToolRounds; round += 1) {
      const llmCallsRemaining = this.maxToolRounds - round + (synthesisAttempted ? 0 : 1);
      const forced = round === 0 ? forcedToolForTurn(transcript, sessionId) : null;
      const completion = await this.completeRound({
        transcript,
        sessionId,
        deadlineMs,
        roundIndex: round,
        toolChoice: toolChoiceForTurn(transcript, sessionId, round),
        tools: ALEXA_QUALITY_TOOL_DEFINITIONS,
        llmCallsRemaining,
      });
      const timedOut = completion.kind === "timeout" || completion.response.finishReason === "timeout";
      const modelMessage: ChatMessage = completion.kind === "ok" && !timedOut
        ? completion.response.message
        : { role: "assistant", content: "" };
      const assistant = withServerSideToolCall(modelMessage, forced, sessionId);
      if (timedOut && !assistant.toolCalls?.length) {
        return this.timeoutResponse(sessionId, findingCards, runId, qgisExport, progress);
      }
      if (assistant.toolCalls && assistant.toolCalls.length > 0) {
        transcript.push(assistant);
        let voiceAnswer: string | null = null;
        for (const toolCall of assistant.toolCalls) {
          const executed = await executeAlexaTool(this.tools, toolCall.name, toolCall.argumentsJson, sessionId || undefined);
          if (executed.result.sessionId) sessionId = executed.result.sessionId;
          progress.sessionId = sessionId;
          const compacted = compactToolResultForModel(executed.result);
          voiceAnswer = readVoiceAnswerFromCompactPayload(compacted) ?? voiceAnswer;
          transcript.push({
            role: "tool",
            content: JSON.stringify(compacted),
            toolCallId: toolCall.id,
          });
          const extracted = extractStructuredState(executed.result, findingCards);
          findingCards = extracted.findings;
          runId = extracted.runId ?? runId;
          progress.runId = runId;
          qgisExport = extracted.qgisExport ?? qgisExport;
          knownIds = mergeCitationIds(knownIds, collectCitationIdsFromFindings(findingCards));
          if (!executed.result.ok && executed.result.error === "refused") {
            return reply(executed.result.message, true);
          }
        }
        // The tool's deterministic answer is the reply; the model only chose the tool.
        if (voiceAnswer) return reply(voiceAnswer, false);
        continue;
      }
      const resolved = await this.resolveAssistantText({
        assistantText: assistant.content,
        transcript,
        sessionId,
        deadlineMs,
        roundIndex: round,
        synthesisAttempted,
      });
      synthesisAttempted = resolved.synthesisAttempted;
      const grounded = assistantClaimsAreGrounded(resolved.text, knownIds);
      return reply(grounded ? resolved.text : refusalTextForMissingCitation(), !grounded);
    }
    return reply("I hit the tool call limit before finishing. Please ask a shorter follow-up.", true);
  }

  private async resolveAssistantText(input: {
    readonly assistantText: string;
    readonly transcript: ChatMessage[];
    readonly sessionId: string;
    readonly deadlineMs: number;
    readonly roundIndex: number;
    readonly synthesisAttempted: boolean;
  }): Promise<{ readonly text: string; readonly synthesisAttempted: boolean }> {
    const trimmed = input.assistantText.trim();
    if (trimmed.length > 0) {
      return { text: trimmed, synthesisAttempted: input.synthesisAttempted };
    }
    if (input.synthesisAttempted || input.transcript.at(-1)?.role !== "tool") {
      return { text: NEUTRAL_EMPTY_REPLY_FALLBACK, synthesisAttempted: input.synthesisAttempted };
    }
    const synthesis = await this.completeRound({
      transcript: input.transcript,
      sessionId: input.sessionId,
      deadlineMs: input.deadlineMs,
      roundIndex: input.roundIndex,
      toolChoice: "none",
      tools: [],
      stepSuffix: " synthesis",
      llmCallsRemaining: 1,
    });
    if (synthesis.kind === "timeout") {
      return { text: NEUTRAL_EMPTY_REPLY_FALLBACK, synthesisAttempted: true };
    }
    const synthesisText = synthesis.response.message.content.trim();
    return {
      text: synthesisText.length > 0 ? synthesisText : NEUTRAL_EMPTY_REPLY_FALLBACK,
      synthesisAttempted: true,
    };
  }

  private async completeRound(input: {
    readonly transcript: readonly ChatMessage[];
    readonly sessionId: string;
    readonly deadlineMs: number;
    readonly roundIndex: number;
    readonly toolChoice: LlmToolChoice;
    readonly tools: typeof ALEXA_QUALITY_TOOL_DEFINITIONS | [];
    readonly stepSuffix?: string;
    readonly llmCallsRemaining: number;
  }): Promise<{ kind: "timeout" } | { kind: "ok"; response: LlmCompletionResponse }> {
    const roundBudgetMs = computeRoundBudgetMs({
      deadlineMs: input.deadlineMs,
      roundTimeoutCapMs: this.roundTimeoutMs,
      llmCallsRemaining: input.llmCallsRemaining,
    });
    if (roundBudgetMs <= 0) return { kind: "timeout" };
    const roundSignal = AbortSignal.timeout(roundBudgetMs);
    const stepLabel = `${describeLlmStep(input.transcript, input.roundIndex)}${input.stepSuffix ?? ""}`;
    try {
      const response = await this.llm.complete({
        messages: trimTranscriptForModel(input.transcript),
        tools: input.tools,
        toolChoice: input.toolChoice,
        signal: roundSignal,
        stepLabel,
        ...(input.sessionId ? { toolSessionId: input.sessionId } : {}),
      });
      return { kind: "ok", response };
    } catch (error) {
      if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
        return { kind: "timeout" };
      }
      throw error;
    }
  }

  private timeoutResponse(
    sessionId: string,
    findingCards: readonly CitedFindingCard[],
    runId: string | null,
    qgisExport: QgisExportArtifact | null,
    progress: LoopProgress,
  ): AlexaSimChatResponse {
    progress.sessionId = sessionId;
    progress.runId = runId;
    return {
      sessionId,
      assistantMessage: "The request timed out before I could finish checking the dataset. Your session is kept; ask again or shorten the request.",
      findings: findingCards,
      runId,
      refused: true,
      qgisExport,
    };
  }
}

function sessionIdFromProgress(progress: LoopProgress, input: AlexaSimChatRequest): string {
  return progress.sessionId.length > 0 ? progress.sessionId : (input.sessionId ?? "");
}

/**
 * When the user explicitly asked for a tool that needs only the session (export, list), a model
 * that answers "please wait", or times out, instead of calling it gets the call made for it.
 */
function withServerSideToolCall(assistant: ChatMessage, forced: string | null, sessionId: string): ChatMessage {
  if (assistant.toolCalls && assistant.toolCalls.length > 0) return assistant;
  if (!sessionId || (forced !== "export_qgis" && forced !== "list_findings")) return assistant;
  return {
    role: "assistant",
    content: "",
    toolCalls: [{ id: `server-${forced}`, name: forced, argumentsJson: JSON.stringify({ sessionId }) }],
  };
}

function extractStructuredState(
  result: { ok: boolean; data?: unknown },
  existing: readonly CitedFindingCard[],
): { findings: readonly CitedFindingCard[]; runId: string | null; qgisExport: QgisExportArtifact | null } {
  if (!result.ok || result.data === undefined) {
    return { findings: existing, runId: null, qgisExport: null };
  }
  const data = result.data;
  if (isListFindingsOutput(data)) {
    return {
      findings: mergeFindingCards(existing, findingSummariesToCards(data.findings)),
      runId: data.runId,
      qgisExport: null,
    };
  }
  if (isRunValidationOutput(data)) {
    return { findings: existing, runId: data.runId, qgisExport: null };
  }
  if (isExplainOutput(data)) {
    return {
      findings: mergeFindingCards(existing, findingSummariesToCards([data.finding])),
      runId: data.runId,
      qgisExport: null,
    };
  }
  if (isExportOutput(data)) {
    return {
      findings: existing,
      runId: data.runId,
      qgisExport: { runId: data.runId, files: data.files },
    };
  }
  return { findings: existing, runId: null, qgisExport: null };
}

function isListFindingsOutput(value: unknown): value is ListFindingsOutput {
  return typeof value === "object" && value !== null && "findings" in value && "runId" in value;
}

function isRunValidationOutput(value: unknown): value is RunValidationOutput {
  return typeof value === "object" && value !== null && "runId" in value && "findingCount" in value;
}

function isExplainOutput(value: unknown): value is { runId: string; finding: FindingSummary } {
  return typeof value === "object" && value !== null && "finding" in value && "runId" in value;
}

function isExportOutput(value: unknown): value is ExportQgisOutput {
  return typeof value === "object" && value !== null && "files" in value && "runId" in value;
}
