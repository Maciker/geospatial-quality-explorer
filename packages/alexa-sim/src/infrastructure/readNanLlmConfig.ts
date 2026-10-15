export type NanLlmConfig = {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string | null;
  readonly useMockLlm: boolean;
  /** Whole-conversation budget; capped below Vercel's 60 s maxDuration. */
  readonly timeoutMs: number;
};

const DEFAULT_TIMEOUT_MS = 45_000;
const MAX_TIMEOUT_MS = 55_000;

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
  return { baseUrl, model, apiKey, useMockLlm, timeoutMs };
}
