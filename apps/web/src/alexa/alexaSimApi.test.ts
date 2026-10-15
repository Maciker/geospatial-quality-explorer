import { afterEach, describe, expect, it, vi } from "vitest";
import { AlexaSimHttpError, postAlexaSimChat } from "./alexaSimApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubJsonError(status: number, payload: object, headers: Record<string, string> = {}): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(payload), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
      }),
    ),
  );
}

async function postFailure(): Promise<unknown> {
  return postAlexaSimChat({ messages: [{ role: "user", content: "hi" }] }).catch((error: unknown) => error);
}

describe("postAlexaSimChat errors", () => {
  it("preserves status, error code, and Retry-After on rate limit", async () => {
    stubJsonError(429, { error: "rate_limited", message: "Too many requests." }, { "Retry-After": "12" });

    const failure = await postFailure();

    expect(failure).toBeInstanceOf(AlexaSimHttpError);
    const httpError = failure as AlexaSimHttpError;
    expect(httpError.status).toBe(429);
    expect(httpError.code).toBe("rate_limited");
    expect(httpError.retryAfterSeconds).toBe(12);
    expect(httpError.message).toContain("Too many requests");
  });

  it("preserves llm_unavailable as a distinct 502 code", async () => {
    stubJsonError(502, { error: "llm_unavailable", message: "The language model is unavailable." });

    const failure = await postFailure();

    expect(failure).toBeInstanceOf(AlexaSimHttpError);
    const httpError = failure as AlexaSimHttpError;
    expect(httpError.status).toBe(502);
    expect(httpError.code).toBe("llm_unavailable");
    expect(httpError.retryAfterSeconds).toBeNull();
  });
});
