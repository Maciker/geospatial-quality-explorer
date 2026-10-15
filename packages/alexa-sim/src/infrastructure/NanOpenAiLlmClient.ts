import type { ChatMessage } from "../domain/chatTypes.js";
import type { LlmCompletionRequest, LlmCompletionResponse, LlmPort } from "../application/LlmPort.js";
import type { NanLlmConfig } from "./readNanLlmConfig.js";

type OpenAiMessage = {
  role: string;
  content: string | null;
  tool_call_id?: string;
  tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
};

/** Fixed-text failure: provider replies and transport errors can echo the API key, so none of their text is kept. */
export class LlmUnavailableError extends Error {
  constructor(readonly httpStatus: number | null) {
    super(httpStatus === null ? "LLM request failed before a usable reply." : `LLM request failed with HTTP ${httpStatus}.`);
    this.name = "LlmUnavailableError";
  }
}

export class NanOpenAiLlmClient implements LlmPort {
  private readonly config: NanLlmConfig;

  constructor(config: NanLlmConfig) {
    this.config = config;
  }

  async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
    if (!this.config.apiKey) {
      return {
        finishReason: "stop",
        message: {
          role: "assistant",
          content: "Live LLM is disabled because NAN_API_KEY is not set. Enable ALEXA_SIM_MOCK_LLM=deterministic for local demos.",
        },
      };
    }
    const body = {
      model: this.config.model,
      messages: toOpenAiMessages(request.messages),
      tools: request.tools,
      tool_choice: "auto" as const,
      max_tokens: this.config.maxTokens,
    };
    const init: RequestInit = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(body),
    };
    if (request.signal) init.signal = request.signal;
    const startedAt = Date.now();
    const response = await fetch(`${this.config.baseUrl.replace(/\/$/, "")}/chat/completions`, init).catch((error: unknown) => {
      throw isAbort(error) ? error : new LlmUnavailableError(null);
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new LlmUnavailableError(response.status);
    }
    const payload = await response.json().catch((error: unknown) => {
      throw isAbort(error) ? error : new LlmUnavailableError(null);
    }) as {
      choices?: Array<{
        finish_reason?: string;
        message?: {
          role?: string;
          content?: string | null;
          tool_calls?: Array<{ id: string; type: "function"; function: { name: string; arguments: string } }>;
        };
      }>;
    };
    const step = request.stepLabel ? ` ${request.stepLabel}` : "";
    console.info(`alexa-sim: LLM round ${Date.now() - startedAt} ms (HTTP ${response.status})${step}`);
    const choice = payload.choices?.[0];
    const message = choice?.message;
    if (!message) {
      return { finishReason: "stop", message: { role: "assistant", content: "No completion returned." } };
    }
    const toolCalls = message.tool_calls?.map((call) => ({
      id: call.id,
      name: call.function.name,
      argumentsJson: call.function.arguments,
    }));
    if (toolCalls && toolCalls.length > 0) {
      return {
        finishReason: "tool_calls",
        message: {
          role: "assistant",
          content: message.content ?? "",
          toolCalls,
        },
      };
    }
    return {
      finishReason: choice.finish_reason === "length" ? "length" : "stop",
      message: { role: "assistant", content: message.content ?? "" },
    };
  }
}

function toOpenAiMessages(messages: readonly ChatMessage[]): OpenAiMessage[] {
  return messages.map((message) => {
    if (message.role === "tool") {
      return { role: "tool", content: message.content, tool_call_id: message.toolCallId ?? "tool" };
    }
    if (message.toolCalls && message.toolCalls.length > 0) {
      return {
        role: "assistant",
        content: message.content.length > 0 ? message.content : null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: "function" as const,
          function: { name: call.name, arguments: call.argumentsJson },
        })),
      };
    }
    return { role: message.role, content: message.content };
  });
}

function isAbort(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}
