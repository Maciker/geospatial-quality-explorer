import type { ChatMessage } from "../../src/domain/chatTypes.js";
import type { LlmCompletionResponse, LlmPort } from "../../src/application/LlmPort.js";
import type { QualityToolsPort } from "../../../alexa-tools/src/application/QualityToolsPort.js";
import { ConversationalLoop } from "../../src/application/ConversationalLoop.js";
import type { AlexaSimChatResponse } from "../../src/domain/chatTypes.js";
import { DeterministicMockLlm } from "../../src/infrastructure/DeterministicMockLlm.js";

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
        return toolCallReply("e1", "export_qgis", { sessionId: request.toolSessionId ?? validatedSessionId });
      }
      return textReply("The QGIS bundle is ready. Download it from the simulation panel.");
    },
  };
}

export function blankValidationToolChainLlm(): LlmPort {
  return {
    async complete(request): Promise<LlmCompletionResponse> {
      if (!request.messages.some((message) => message.role === "tool")) {
        return toolCallReply("open", "list_fixtures", {});
      }
      if (!request.messages.some((message) => message.content.includes("findingCount"))) {
        const toolPayload = request.messages.find((message) => message.role === "tool")?.content ?? "{}";
        const sessionId = request.toolSessionId ?? (JSON.parse(toolPayload) as { sessionId?: string }).sessionId ?? "";
        return toolCallReply("run", "run_validation", { sessionId, fixtureId: "portfolio" });
      }
      return textReply("");
    },
  };
}

export { toolCall as toolCallReply } from "../../src/infrastructure/DeterministicMockLlm.js";
import { toolCall as toolCallReply } from "../../src/infrastructure/DeterministicMockLlm.js";

/** A model reply with plain text. */
export function textReply(content: string): LlmCompletionResponse {
  return { finishReason: "stop", message: { role: "assistant", content } };
}

/** A model call that never answers until the loop aborts it. */
export function stallUntilAbort(signal: AbortSignal | undefined): Promise<LlmCompletionResponse> {
  return new Promise((_resolve, reject) => {
    signal?.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })));
  });
}

/** Validates the portfolio fixture with the scripted mock and returns the reply. */
export function validatePortfolio(tools: QualityToolsPort): Promise<AlexaSimChatResponse> {
  return new ConversationalLoop({ tools, llm: new DeterministicMockLlm() }).run({
    messages: [{ role: "user", content: "Validate the portfolio fixture." }],
  });
}
