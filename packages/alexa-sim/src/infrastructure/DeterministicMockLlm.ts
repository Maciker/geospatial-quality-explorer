import type { ChatMessage } from "../domain/chatTypes.js";
import type { LlmCompletionRequest, LlmCompletionResponse, LlmPort } from "../application/LlmPort.js";

type MockState = {
  runId: string | null;
  findings: Array<{ findingId: string; ruleId: string; featureId: string; explanation: string }>;
  findingIndex: number;
};

const states = new Map<string, MockState>();

function stateKey(messages: readonly ChatMessage[], toolSessionId?: string): string {
  if (toolSessionId && toolSessionId.length > 0) return toolSessionId;
  const toolPayload = findLastToolContent(messages);
  const sessionMatch = /"sessionId"\s*:\s*"([^"]+)"/.exec(toolPayload);
  return sessionMatch?.[1] ?? "default";
}

function lastUserText(messages: readonly ChatMessage[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user") return message.content.toLowerCase();
  }
  return "";
}

function lastToolResult(messages: readonly ChatMessage[]): unknown {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "tool") {
      try {
        return JSON.parse(message.content) as unknown;
      } catch {
        return null;
      }
    }
  }
  return null;
}

function toolCall(id: string, name: string, args: Record<string, unknown>): LlmCompletionResponse {
  return {
    finishReason: "tool_calls",
    message: {
      role: "assistant",
      content: "",
      toolCalls: [{ id, name, argumentsJson: JSON.stringify(args) }],
    },
  };
}

export class DeterministicMockLlm implements LlmPort {
  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    if (request.signal?.aborted) {
      const error = new Error("Aborted");
      error.name = "AbortError";
      throw error;
    }
    const user = lastUserText(request.messages);
    const toolResult = lastToolResult(request.messages);
    const key = stateKey(request.messages, request.toolSessionId);
    const state = states.get(key) ?? { runId: null, findings: [], findingIndex: 0 };
    states.set(key, state);

    if (user.includes("repair") || user.includes("upload http")) {
      return {
        finishReason: "stop",
        message: {
          role: "assistant",
          content: "I cannot do that. It is out of scope for this simulation.",
        },
      };
    }

    const sessionId = request.toolSessionId ?? readSessionId(toolResult);
    const pendingAssistantTool = request.messages.at(-1)?.role === "user";
    if (pendingAssistantTool || request.messages.at(-1)?.role === "system") {
      if (user.includes("portfolio") && user.includes("valid")) {
        if (!sessionId) {
          return toolCall("tc_open", "list_fixtures", {});
        }
        return toolCall("tc_run", "run_validation", {
          sessionId,
          fixtureId: "portfolio",
        });
      }
      if (user.includes("list") && user.includes("finding")) {
        return toolCall("tc_list", "list_findings", {
          sessionId: sessionId ?? "",
          runId: state.runId ?? "",
          limit: 5,
        });
      }
      if (user.includes("next one") || user.includes("next finding")) {
        const next = state.findings[state.findingIndex + 1];
        if (!next) {
          return {
            finishReason: "stop",
            message: { role: "assistant", content: "There is no next finding in the list I have." },
          };
        }
        state.findingIndex += 1;
        return toolCall("tc_explain", "explain_finding", {
          sessionId: sessionId ?? "",
          findingId: next.findingId,
        });
      }
      if (user.includes("explain") && user.includes("bogus")) {
        if (!sessionId) {
          return toolCall("tc_open2", "list_fixtures", {});
        }
        return toolCall("tc_bad", "explain_finding", {
          sessionId,
          findingId: `${"a".repeat(64)}:0:geometry.invalid`,
        });
      }
      if (user.includes("export qgis")) {
        return toolCall("tc_export", "export_qgis", {
          sessionId: sessionId ?? "",
          runId: state.runId ?? "",
        });
      }
      if (user.includes("fixture")) {
        return toolCall("tc_fixtures", "list_fixtures", {});
      }
    }

    if (request.messages.at(-1)?.role === "tool") {
      if (typeof toolResult === "object" && toolResult !== null && "ok" in toolResult) {
        const envelope = toolResult as { ok: boolean; data?: Record<string, unknown> };
        if (envelope.ok && envelope.data && "runId" in envelope.data && "findingCount" in envelope.data) {
          state.runId = String(envelope.data.runId);
        }
        if (envelope.ok && envelope.data && Array.isArray(envelope.data.findings)) {
          state.findings = envelope.data.findings as MockState["findings"];
          state.findingIndex = 0;
        }
      }
      if (user.includes("portfolio") && user.includes("valid") && sessionId && !state.runId) {
        return toolCall("tc_run_after_open", "run_validation", { sessionId, fixtureId: "portfolio" });
      }
      if ((user.includes("list") && user.includes("finding")) && sessionId && state.runId && state.findings.length === 0) {
        return toolCall("tc_list_after_open", "list_findings", {
          sessionId,
          runId: state.runId,
          limit: 5,
        });
      }
    }

    if (typeof toolResult === "object" && toolResult !== null && "ok" in toolResult) {
      const envelope = toolResult as { ok: boolean; data?: Record<string, unknown>; error?: string; message?: string };
      if (!envelope.ok) {
        return {
          finishReason: "stop",
          message: {
            role: "assistant",
            content: envelope.message ?? `Tool returned ${envelope.error ?? "an error"}. I cannot invent details.`,
          },
        };
      }
      if (envelope.data && "runId" in envelope.data && "findingCount" in envelope.data) {
        state.runId = String(envelope.data.runId);
        return {
          finishReason: "stop",
          message: {
            role: "assistant",
            content: `Validation finished for portfolio. runId ${state.runId}. Ask when you want the prioritized list.`,
          },
        };
      }
      if (envelope.data && Array.isArray(envelope.data.findings)) {
        const findings = envelope.data.findings as Array<{
          findingId: string;
          ruleId: string;
          featureId: string;
          explanation: string;
        }>;
        state.findings = findings;
        state.findingIndex = 0;
        const first = findings[0];
        if (!first) {
          return {
            finishReason: "stop",
            message: { role: "assistant", content: "The run has zero findings to cite." },
          };
        }
        return {
          finishReason: "stop",
          message: {
            role: "assistant",
            content: `The top issue is findingId ${first.findingId} on featureId ${first.featureId} (${first.ruleId}): ${first.explanation}`,
          },
        };
      }
      if (envelope.data && envelope.data.finding && typeof envelope.data.finding === "object") {
        const finding = envelope.data.finding as {
          findingId: string;
          ruleId: string;
          featureId: string;
          explanation: string;
        };
        return {
          finishReason: "stop",
          message: {
            role: "assistant",
            content: `findingId ${finding.findingId} (${finding.ruleId}) on featureId ${finding.featureId}: ${finding.explanation}`,
          },
        };
      }
      if (envelope.data && envelope.data.files) {
        return {
          finishReason: "stop",
          message: {
            role: "assistant",
            content: "QGIS bundle is ready from export_qgis. Download it from the simulation panel.",
          },
        };
      }
    }

    return {
      finishReason: "stop",
      message: {
        role: "assistant",
        content: "Ask me to validate the portfolio fixture, list findings, explain the next one, or export QGIS.",
      },
    };
  }
}

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

export function resetDeterministicMockLlmState(): void {
  states.clear();
}
