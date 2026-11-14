import { afterEach, beforeEach } from "vitest";
import { resetSharedToolsAdapterForTests } from "../../src/infrastructure/createToolsAdapter.js";

/** Env vars that switch the HTTP handler from the deterministic mock to a live provider. */
const LIVE_LLM_ENV_KEYS = ["NAN_API_KEY", "ALEXA_SIM_LLM_API_KEY"] as const;

const savedLiveLlmEnv: Record<(typeof LIVE_LLM_ENV_KEYS)[number], string | undefined> = {
  NAN_API_KEY: process.env.NAN_API_KEY,
  ALEXA_SIM_LLM_API_KEY: process.env.ALEXA_SIM_LLM_API_KEY,
};

/**
 * Unit tests that hit `handleAlexaSimHttp` must not inherit shell LLM credentials;
 * call once per test file (same pattern as handleAlexaSimHttp.test.ts).
 */
export function registerDeterministicLlmTestEnv(): void {
  beforeEach(() => {
    for (const name of LIVE_LLM_ENV_KEYS) {
      delete process.env[name];
    }
  });

  afterEach(() => {
    for (const name of LIVE_LLM_ENV_KEYS) {
      const value = savedLiveLlmEnv[name];
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
    resetSharedToolsAdapterForTests();
  });
}