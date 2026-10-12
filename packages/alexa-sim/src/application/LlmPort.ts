import type { ChatMessage } from "../domain/chatTypes.js";

export type LlmCompletionRequest = {
  readonly messages: readonly ChatMessage[];
  readonly tools: readonly OpenAiToolDefinition[];
  readonly signal?: AbortSignal;
  readonly toolSessionId?: string;
};

export type OpenAiToolDefinition = {
  readonly type: "function";
  readonly function: {
    readonly name: string;
    readonly description: string;
    readonly parameters: Record<string, unknown>;
  };
};

export type LlmCompletionResponse = {
  readonly message: ChatMessage;
  readonly finishReason: "stop" | "tool_calls" | "length" | "timeout";
};

export type LlmPort = {
  complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse>;
};
