import { createOpenAICompatAdapter } from "./openai-compat.mjs";

const DASHSCOPE_BASE_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const JSON_ONLY_GUIDANCE =
  "You must answer with a single valid JSON object that matches the requested schema. " +
  "Do not add explanations, Markdown or code fences.";

/**
 * Qwen exposes an OpenAI-compatible API, so it reuses that transport. This adapter only
 * adjusts the defaults and hardens the two areas the audit flagged as weak for Qwen:
 * strict JSON output and unreliable parallel tool calls.
 *
 * Set config.structuredOutputs = true only for Qwen deployments that support the full
 * json_schema response_format. Otherwise it degrades to json_object mode plus a strong
 * JSON-only instruction, and downstream schema validation remains the real guarantee.
 */
export function createQwenAdapter(config) {
  const structuredOutputs = config.structuredOutputs ?? false;
  const inner = createOpenAICompatAdapter({
    ...config,
    providerName: config.providerName ?? "qwen",
    baseUrl: config.baseUrl ?? DASHSCOPE_BASE_URL,
    model: config.model ?? "qwen2.5-coder-32b-instruct",
  });

  return {
    name: inner.name,
    async complete(request) {
      const hardened = { ...request };

      if (request.responseSchema) {
        hardened.system = `${request.system ? `${request.system}\n\n` : ""}${JSON_ONLY_GUIDANCE}`;
        if (!structuredOutputs) {
          hardened.responseSchema = undefined;
          hardened.jsonObjectMode = true;
        }
      }

      if (config.disableParallelToolCalls !== false && request.tools?.length) {
        // Force the model to emit at most one tool call per turn; parallel tool calls are
        // unreliable on smaller Qwen variants.
        hardened.extraBody = { ...(request.extraBody ?? {}), parallel_tool_calls: false };
      }

      return inner.complete(hardened);
    },
  };
}
