import { describe, expect, it } from "vitest";
import { AlexaSimHttpError } from "./alexaSimApi";
import { formatAlexaSimErrorMessage, retryDelayMs, shouldAutoRetryAlexaSimError } from "./alexaSimRetry";

describe("alexaSimRetry", () => {
  it("honors Retry-After for rate_limited within a finite cap", () => {
    const error = new AlexaSimHttpError("Too many requests.", {
      status: 429,
      code: "rate_limited",
      retryAfterSeconds: 7,
    });

    expect(shouldAutoRetryAlexaSimError(error, 0)).toBe(true);
    expect(shouldAutoRetryAlexaSimError(error, 2)).toBe(false);
    expect(retryDelayMs(error)).toBe(7_000);
    expect(formatAlexaSimErrorMessage(error)).toMatch(/retry after 7s/i);
  });

  it("offers a manual retry path for llm_unavailable without inventing Retry-After", () => {
    const error = new AlexaSimHttpError("The language model is unavailable.", {
      status: 502,
      code: "llm_unavailable",
      retryAfterSeconds: null,
    });

    expect(shouldAutoRetryAlexaSimError(error, 0)).toBe(false);
    expect(formatAlexaSimErrorMessage(error)).toMatch(/try again/i);
  });
});
