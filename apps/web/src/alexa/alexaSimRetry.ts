import { AlexaSimHttpError } from "./alexaSimApi";

/** Finite automatic retries for app rate limits only. */
export const MAX_ALEXA_SIM_AUTO_RETRIES = 2;
const MAX_RETRY_AFTER_SECONDS = 60;
const DEFAULT_RATE_LIMIT_WAIT_SECONDS = 5;

export function shouldAutoRetryAlexaSimError(error: AlexaSimHttpError, attempt: number): boolean {
  return error.code === "rate_limited" && attempt < MAX_ALEXA_SIM_AUTO_RETRIES;
}

export function retryDelayMs(error: AlexaSimHttpError): number {
  const seconds = clampRetryAfterSeconds(error.retryAfterSeconds ?? DEFAULT_RATE_LIMIT_WAIT_SECONDS);
  return seconds * 1_000;
}

export function formatAlexaSimErrorMessage(error: AlexaSimHttpError): string {
  if (error.code === "rate_limited") {
    const seconds = clampRetryAfterSeconds(error.retryAfterSeconds ?? DEFAULT_RATE_LIMIT_WAIT_SECONDS);
    return `${error.message} Rate limited — retry after ${seconds}s (or wait and send again).`;
  }
  if (error.code === "llm_unavailable") {
    return `${error.message} The language model is unavailable — try again without reloading the page.`;
  }
  return error.message;
}

function clampRetryAfterSeconds(value: number): number {
  if (!Number.isFinite(value) || value < 1) return DEFAULT_RATE_LIMIT_WAIT_SECONDS;
  return Math.min(Math.ceil(value), MAX_RETRY_AFTER_SECONDS);
}
