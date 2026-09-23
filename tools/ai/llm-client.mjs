import { createOpenAICompatAdapter } from "./adapters/openai-compat.mjs";
import { createAnthropicAdapter } from "./adapters/anthropic.mjs";
import { createQwenAdapter } from "./adapters/qwen.mjs";
import { createMockAdapter } from "./adapters/mock.mjs";

/**
 * Port: every adapter implements `async complete(request) -> result`.
 *
 * request: { system?, prompt?, messages?, tools?, responseSchema?, jsonObjectMode?,
 *            temperature?, maxTokens?, model?, toolChoice?, extraBody? }
 * result:  { text, json?, toolCalls, usage?, raw }
 *
 * Adapters keep the harness model-agnostic. Swapping a model is a config change, never a
 * code change in the workflow tooling.
 */
const REGISTRY = {
  openai: createOpenAICompatAdapter,
  "openai-compat": createOpenAICompatAdapter,
  azure: createOpenAICompatAdapter,
  vllm: createOpenAICompatAdapter,
  ollama: createOpenAICompatAdapter,
  groq: createOpenAICompatAdapter,
  openrouter: createOpenAICompatAdapter,
  anthropic: createAnthropicAdapter,
  qwen: createQwenAdapter,
  dashscope: createQwenAdapter,
  mock: createMockAdapter,
};

export function listProviders() {
  return Object.keys(REGISTRY);
}

function toBool(value, fallback) {
  if (value === undefined) return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

export function resolveConfig(role = "default", overrides = {}) {
  const upper = role.toUpperCase().replace(/-/g, "_");
  const pick = (suffix) => process.env[`AI_${upper}_${suffix}`] ?? process.env[`AI_${suffix}`];

  const provider = overrides.provider ?? pick("PROVIDER") ?? "mock";
  return {
    provider,
    providerName: provider,
    model: overrides.model ?? pick("MODEL"),
    baseUrl: overrides.baseUrl ?? pick("BASE_URL"),
    apiKey: overrides.apiKey ?? pick("API_KEY"),
    temperature: overrides.temperature ?? (pick("TEMPERATURE") ? Number(pick("TEMPERATURE")) : undefined),
    maxTokens: overrides.maxTokens ?? (pick("MAX_TOKENS") ? Number(pick("MAX_TOKENS")) : undefined),
    structuredOutputs: overrides.structuredOutputs ?? toBool(pick("STRUCTURED_OUTPUTS"), undefined),
    mockResponse: overrides.mockResponse,
  };
}

export function createLLMClient(config) {
  const resolved = typeof config === "string" ? resolveConfig(config) : config;
  const factory = REGISTRY[resolved.provider];
  if (!factory) {
    throw new Error(`Unknown AI provider "${resolved.provider}". Known providers: ${listProviders().join(", ")}`);
  }
  return factory(resolved);
}

export function createClientForRole(role, overrides = {}) {
  return createLLMClient(resolveConfig(role, overrides));
}
