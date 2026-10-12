export type NanLlmConfig = {
  readonly baseUrl: string;
  readonly model: string;
  readonly apiKey: string | null;
  readonly useMockLlm: boolean;
};

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
  return { baseUrl, model, apiKey, useMockLlm };
}
