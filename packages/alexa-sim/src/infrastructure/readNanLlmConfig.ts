export type NanLlmConfig = {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string | null;
  readonly useMockLlm: boolean;
  /** Whole-conversation budget; capped below Vercel's 60 s maxDuration. */
  readonly timeoutMs: number;
  readonly roundTimeoutMs: number;
  readonly maxToolRounds: number;
  readonly maxTokens: number;
  /** When false, request chat_template_kwargs.enable_thinking=false for lower latency. */
  readonly enableThinking: boolean;
};

const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_TIMEOUT_MS = 55_000;
const DEFAULT_ROUND_TIMEOUT_MS = 24_000;
const DEFAULT_MAX_TOOL_ROUNDS = 4;
const DEFAULT_MAX_TOKENS = 1024;

function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.length > 0 ? value : undefined;
}

export function readNanLlmConfig(): NanLlmConfig {
  const baseUrl = readEnv("NAN_BASE_URL")
    ?? readEnv("ALEXA_SIM_LLM_BASE_URL")
    ?? "https://api.nan.builders/v1";
  const model = readEnv("NAN_MODEL")
    ?? readEnv("ALEXA_SIM_LLM_MODEL")
    ?? "qwen3.6";
  const apiKey = readEnv("NAN_API_KEY") ?? readEnv("ALEXA_SIM_LLM_API_KEY") ?? null;
  const mockFlag = readEnv("ALEXA_SIM_MOCK_LLM");
  const useMockLlm = mockFlag === "deterministic" || mockFlag === "1" || mockFlag === "true" || apiKey === null;
  const configuredTimeout = Number.parseInt(readEnv("ALEXA_SIM_TIMEOUT_MS") ?? "", 10);
  const timeoutMs = Number.isFinite(configuredTimeout) && configuredTimeout > 0
    ? Math.min(configuredTimeout, MAX_TIMEOUT_MS)
    : DEFAULT_TIMEOUT_MS;
  const configuredRoundTimeout = Number.parseInt(readEnv("ALEXA_SIM_ROUND_TIMEOUT_MS") ?? "", 10);
  const roundTimeoutMs = Number.isFinite(configuredRoundTimeout) && configuredRoundTimeout > 0
    ? Math.min(configuredRoundTimeout, timeoutMs)
    : Math.min(DEFAULT_ROUND_TIMEOUT_MS, timeoutMs);
  const configuredMaxRounds = Number.parseInt(readEnv("ALEXA_SIM_MAX_TOOL_ROUNDS") ?? "", 10);
  const maxToolRounds = Number.isFinite(configuredMaxRounds) && configuredMaxRounds > 0
    ? configuredMaxRounds
    : DEFAULT_MAX_TOOL_ROUNDS;
  const configuredMaxTokens = Number.parseInt(readEnv("ALEXA_SIM_MAX_TOKENS") ?? "", 10);
  const maxTokens = Number.isFinite(configuredMaxTokens) && configuredMaxTokens > 0
    ? configuredMaxTokens
    : DEFAULT_MAX_TOKENS;
  const thinkingFlag = readEnv("ALEXA_SIM_ENABLE_THINKING") ?? readEnv("NAN_ENABLE_THINKING");
  const enableThinking = thinkingFlag === "1" || thinkingFlag === "true";
  return { baseUrl, model, apiKey, useMockLlm, timeoutMs, roundTimeoutMs, maxToolRounds, maxTokens, enableThinking };
}
