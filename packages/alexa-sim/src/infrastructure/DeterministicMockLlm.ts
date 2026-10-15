import type { ChatMessage } from "../domain/chatTypes.js";
import type { LlmCompletionRequest, LlmCompletionResponse, LlmPort } from "../application/LlmPort.js";
import { catalogFixtureFromValidateCommand } from "../application/sessionRecovery.js";

const FINDING_ID = /[a-f0-9]{64}:\d+:[a-z0-9_.]+[a-z0-9_]/g;

function lastUserText(messages: readonly ChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user") return message.content.toLowerCase();
  }
  return "";
}

function lastToolResult(messages: readonly ChatMessage[]): unknown {
  try {
    return JSON.parse(findLastToolContent(messages)) as unknown;
  } catch {
    return null;
  }
}

/** Finding ids in priority order, read from the server's session context like the live model. */
function prioritizedFindingIds(messages: readonly ChatMessage[]): string[] {
  const context = messages.find((message) => message.role === "system" && message.content.includes("priority order"));
  return context ? [...context.content.matchAll(FINDING_ID)].map((match) => match[0]) : [];
}

/** The finding after the last one an assistant reply mentioned, or the first one. */
function nextFindingId(messages: readonly ChatMessage[]): string | null {
  const order = prioritizedFindingIds(messages);
  const mentioned = messages
    .filter((message) => message.role === "assistant")
    .flatMap((message) => [...message.content.matchAll(FINDING_ID)].map((match) => match[0]));
  const last = mentioned.at(-1);
  return order[last === undefined ? 0 : order.indexOf(last) + 1] ?? null;
}

function textReply(content: string): LlmCompletionResponse {
  return { finishReason: "stop", message: { role: "assistant", content } };
}

/** A model reply that calls one tool; shared with the test fixtures. */
export function toolCall(id: string, name: string, args: Record<string, unknown>): LlmCompletionResponse {
  return {
    finishReason: "tool_calls",
    message: {
      role: "assistant",
      content: "",
      toolCalls: [{ id, name, argumentsJson: JSON.stringify(args) }],
    },
  };
}

/**
 * Scripted stand-in for the live model. It only chooses tools: the loop speaks each tool's own
 * voiceAnswer, so the mock writes text only for refusals, tool errors and the help prompt.
 */
export class DeterministicMockLlm implements LlmPort {
  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    if (request.signal?.aborted) {
      const error = new Error("Aborted");
      error.name = "AbortError";
      throw error;
    }
    const user = lastUserText(request.messages);
    if (user.includes("repair") || user.includes("upload http")) {
      return textReply("I cannot do that. It is out of scope for this simulation.");
    }
    const toolResult = lastToolResult(request.messages);
    const sessionId = request.toolSessionId ?? readSessionId(toolResult);
    const validateFixtureId = catalogFixtureFromValidateCommand(user);

    if (request.messages.at(-1)?.role === "tool") {
      const envelope = toolResult as { ok?: boolean; error?: string; message?: string } | null;
      if (envelope?.ok === false) {
        return textReply(envelope.message ?? `Tool returned ${envelope.error ?? "an error"}. I cannot invent details.`);
      }
      if (validateFixtureId && sessionId) {
        return toolCall("tc_run_after_open", "run_validation", { sessionId, fixtureId: validateFixtureId });
      }
      return textReply(HELP_TEXT);
    }

    if (validateFixtureId) {
      return sessionId
        ? toolCall("tc_run", "run_validation", { sessionId, fixtureId: validateFixtureId })
        : toolCall("tc_open", "list_fixtures", {});
    }
    if (user.includes("list") && user.includes("finding")) {
      return toolCall("tc_list", "list_findings", { sessionId: sessionId ?? "", limit: 5 });
    }
    if (user.includes("next one") || user.includes("next finding") || (user.includes("explain") && user.includes("next"))) {
      const next = nextFindingId(request.messages);
      return next
        ? toolCall("tc_explain", "explain_finding", { sessionId: sessionId ?? "", findingId: next })
        : textReply("Ask me to list the findings first, then I can explain the next one.");
    }
    if (user.includes("explain") && user.includes("bogus")) {
      return sessionId
        ? toolCall("tc_bad", "explain_finding", { sessionId, findingId: `${"a".repeat(64)}:0:geometry.invalid` })
        : toolCall("tc_open2", "list_fixtures", {});
    }
    if (user.includes("export qgis")) {
      return toolCall("tc_export", "export_qgis", { sessionId: sessionId ?? "" });
    }
    if (user.includes("fixture")) {
      return toolCall("tc_fixtures", "list_fixtures", {});
    }
    return textReply(HELP_TEXT);
  }
}

const HELP_TEXT = "Ask me to validate the portfolio or ne-admin0-westeurope fixture, list findings, explain the next one, or export QGIS.";

function findLastToolContent(messages: readonly ChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "tool") return message.content;
  }
  return "";
}

function readSessionId(toolResult: unknown): string | null {
  if (typeof toolResult === "object" && toolResult !== null && "sessionId" in toolResult) {
    return String((toolResult as { sessionId: string }).sessionId);
  }
  return null;
}
