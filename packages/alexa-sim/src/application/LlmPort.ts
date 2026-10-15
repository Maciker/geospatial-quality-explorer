import type { ChatMessage } from "../domain/chatTypes.js";

export type LlmToolChoice =
  | "auto"
  | "none"
  | { readonly type: "function"; readonly function: { readonly name: string } };

export type LlmCompletionRequest = {
  readonly messages: readonly ChatMessage[];
  readonly tools: readonly OpenAiToolDefinition[];
  readonly signal?: AbortSignal;
  readonly toolSessionId?: string;
  /** Shown in alexa-sim LLM round logs for live diagnosis. */
  readonly stepLabel?: string;
  readonly toolChoice?: LlmToolChoice;
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
