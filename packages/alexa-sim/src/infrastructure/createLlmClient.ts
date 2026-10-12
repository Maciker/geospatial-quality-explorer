import type { LlmPort } from "../application/LlmPort.js";
import { DeterministicMockLlm } from "./DeterministicMockLlm.js";
import { NanOpenAiLlmClient } from "./NanOpenAiLlmClient.js";
import { readNanLlmConfig } from "./readNanLlmConfig.js";

export function createLlmClient(): LlmPort {
  const config = readNanLlmConfig();
  if (config.useMockLlm) return new DeterministicMockLlm();
  return new NanOpenAiLlmClient(config);
}
