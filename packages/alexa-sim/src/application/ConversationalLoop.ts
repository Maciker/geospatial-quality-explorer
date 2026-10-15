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
import {
  assistantCitesKnownIds,
  assistantReplyExemptFromCitationGuard,
  assistantStatesValidationResults,
  collectCitationIdsFromFindings,
  mergeCitationIds,
  refusalTextForMissingCitation,
} from "./citationPolicy.js";
import { executeAlexaTool } from "./executeAlexaTool.js";
import { findingSummariesToCards, mergeFindingCards } from "./extractFindingCards.js";
import type { LlmPort } from "./LlmPort.js";
import { ALEXA_QUALITY_TOOL_DEFINITIONS } from "./openAiToolDefinitions.js";
import { compactToolResultForModel, sessionContextMessage, trimTranscriptForModel } from "./modelPayload.js";
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
        return {
          sessionId: progress.sessionId,
          assistantMessage: "The request timed out before I could finish checking the dataset. Your session is kept; ask again or shorten the request.",
          findings: [],
          runId: progress.runId,
          refused: true,
          qgisExport: null,
        };
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

    const snapshot = sessionId ? await this.tools.describeSession(sessionId) : null;
    if (snapshot) {
      runId = snapshot.runId;
      progress.runId = runId;
      knownIds = mergeCitationIds(knownIds, {
        findingIds: new Set(snapshot.prioritizedFindingIds),
        ruleIds: new Set(),
        featureIds: new Set(),
      });
    }
    const transcript: ChatMessage[] = [
      { role: "system", content: ALEXA_SIM_SYSTEM_INSTRUCTIONS },
      ...(snapshot ? [sessionContextMessage(snapshot)] : []),
      ...input.messages.filter((message) => message.role !== "system"),
    ];

    for (let round = 0; round < this.maxToolRounds; round += 1) {
      const remainingMs = deadlineMs - Date.now();
      if (remainingMs <= 0) {
        return this.timeoutResponse(sessionId, findingCards, runId, qgisExport, progress);
      }
      const roundBudgetMs = Math.min(remainingMs, this.roundTimeoutMs);
      const roundSignal = AbortSignal.timeout(roundBudgetMs);
      const stepLabel = describeLlmStep(transcript, round);
      let completion;
      try {
        completion = await this.llm.complete({
          messages: trimTranscriptForModel(transcript),
          tools: ALEXA_QUALITY_TOOL_DEFINITIONS,
          signal: roundSignal,
          stepLabel,
          ...(sessionId ? { toolSessionId: sessionId } : {}),
        });
      } catch (error) {
        if (error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError")) {
          return this.timeoutResponse(sessionId, findingCards, runId, qgisExport, progress);
        }
        throw error;
      }
      if (completion.finishReason === "timeout") {
        return {
          sessionId,
          assistantMessage: "The language model timed out.",
          findings: findingCards,
          runId,
          refused: true,
          qgisExport,
        };
      }
      const assistant = completion.message;
      if (assistant.toolCalls && assistant.toolCalls.length > 0) {
        transcript.push(assistant);
        for (const toolCall of assistant.toolCalls) {
          const executed = await executeAlexaTool(this.tools, toolCall.name, toolCall.argumentsJson, sessionId || undefined);
          if (executed.result.sessionId) sessionId = executed.result.sessionId;
          progress.sessionId = sessionId;
          const payload = JSON.stringify(compactToolResultForModel(executed.result));
          transcript.push({
            role: "tool",
            content: payload,
            toolCallId: toolCall.id,
          });
          const extracted = extractStructuredState(executed.result, findingCards);
          findingCards = extracted.findings;
          runId = extracted.runId ?? runId;
          progress.runId = runId;
          qgisExport = extracted.qgisExport ?? qgisExport;
          knownIds = mergeCitationIds(knownIds, collectCitationIdsFromFindings(findingCards));
          if (!executed.result.ok && executed.result.error === "refused") {
            return {
              sessionId,
              assistantMessage: executed.result.message,
              findings: findingCards,
              runId,
              refused: true,
              qgisExport,
            };
          }
        }
        continue;
      }
      const text = assistant.content.trim();
      if (text.length === 0) {
        return {
          sessionId,
          assistantMessage: "I do not have a response right now.",
          findings: findingCards,
          runId,
          refused: true,
          qgisExport,
        };
      }
      if (
        !assistantReplyExemptFromCitationGuard(text)
        && assistantStatesValidationResults(text)
        && !findingCards.some((card) => text.includes(card.findingId))
        && !assistantCitesKnownIds(text, knownIds)
        && !(runId !== null && text.includes(runId))
      ) {
        return {
          sessionId,
          assistantMessage: refusalTextForMissingCitation(),
          findings: findingCards,
          runId,
          refused: true,
          qgisExport,
        };
      }
      return {
        sessionId,
        assistantMessage: text,
        findings: findingCards,
        runId,
        refused: false,
        qgisExport,
      };
    }
    return {
      sessionId,
      assistantMessage: "I hit the tool call limit before finishing. Please ask a shorter follow-up.",
      findings: findingCards,
      runId,
      refused: true,
      qgisExport,
    };
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

function describeLlmStep(transcript: readonly ChatMessage[], roundIndex: number): string {
  const last = transcript.at(-1);
  if (!last) return `turn ${roundIndex + 1} initial`;
  if (last.role === "user") return `turn ${roundIndex + 1} after user`;
  if (last.role === "tool") {
    const preview = last.content.slice(0, 80).replace(/\s+/g, " ");
    return `turn ${roundIndex + 1} after tool ${preview}`;
  }
  if (last.role === "assistant" && last.toolCalls && last.toolCalls.length > 0) {
    return `turn ${roundIndex + 1} after assistant tool_calls ${last.toolCalls.map((call) => call.name).join(",")}`;
  }
  return `turn ${roundIndex + 1} follow-up`;
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
