import type { ChatMessage } from "../../src/domain/chatTypes.js";
import type { LlmCompletionResponse, LlmPort } from "../../src/application/LlmPort.js";

export function portfolioValidateListMessages(
  validatedMessage: string,
  listedMessage?: string,
): ChatMessage[] {
  const messages: ChatMessage[] = [
    { role: "user", content: "Validate the portfolio fixture." },
    { role: "assistant", content: validatedMessage },
    { role: "user", content: "List the findings." },
  ];
  if (listedMessage) {
    messages.push({ role: "assistant", content: listedMessage });
  }
  return messages;
}

export function exportAfterValidationLlm(validatedSessionId: string): LlmPort {
  return {
    async complete(request): Promise<LlmCompletionResponse> {
      if (!request.messages.some((message) => message.role === "tool")) {
        return {
          finishReason: "tool_calls",
          message: {
            role: "assistant",
            content: "",
            toolCalls: [{
              id: "e1",
              name: "export_qgis",
              argumentsJson: JSON.stringify({ sessionId: request.toolSessionId ?? validatedSessionId }),
            }],
          },
        };
      }
      return {
        finishReason: "stop",
        message: {
          role: "assistant",
          content: "The QGIS bundle is ready. Download it from the simulation panel.",
        },
      };
    },
  };
}

export function blankValidationToolChainLlm(): LlmPort {
  return {
    async complete(request): Promise<LlmCompletionResponse> {
      if (!request.messages.some((message) => message.role === "tool")) {
        return {
          finishReason: "tool_calls",
          message: {
            role: "assistant",
            content: "",
            toolCalls: [{ id: "open", name: "list_fixtures", argumentsJson: "{}" }],
          },
        };
      }
      if (!request.messages.some((message) => message.content.includes("findingCount"))) {
        const toolPayload = request.messages.find((message) => message.role === "tool")?.content ?? "{}";
        const sessionId = request.toolSessionId ?? (JSON.parse(toolPayload) as { sessionId?: string }).sessionId ?? "";
        return {
          finishReason: "tool_calls",
          message: {
            role: "assistant",
            content: "",
            toolCalls: [{
              id: "run",
              name: "run_validation",
              argumentsJson: JSON.stringify({ sessionId, fixtureId: "portfolio" }),
            }],
          },
        };
      }
      return { finishReason: "stop", message: { role: "assistant", content: "" } };
    },
  };
}
