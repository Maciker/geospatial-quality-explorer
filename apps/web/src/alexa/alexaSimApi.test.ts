import { afterEach, describe, expect, it, vi } from "vitest";
import { AlexaSimHttpError, postAlexaSimChat } from "./alexaSimApi";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("postAlexaSimChat errors", () => {
  it("preserves status, error code, and Retry-After on rate limit", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "rate_limited", message: "Too many requests." }), {
          status: 429,
          headers: { "Retry-After": "12", "Content-Type": "application/json" },
        }),
      ),
    );

    const failure = await postAlexaSimChat({ messages: [{ role: "user", content: "hi" }] }).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(AlexaSimHttpError);
    const httpError = failure as AlexaSimHttpError;
    expect(httpError.status).toBe(429);
    expect(httpError.code).toBe("rate_limited");
    expect(httpError.retryAfterSeconds).toBe(12);
    expect(httpError.message).toContain("Too many requests");
  });

  it("preserves llm_unavailable as a distinct 502 code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ error: "llm_unavailable", message: "The language model is unavailable." }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );

    const failure = await postAlexaSimChat({ messages: [{ role: "user", content: "hi" }] }).catch(
      (error: unknown) => error,
    );

    expect(failure).toBeInstanceOf(AlexaSimHttpError);
    const httpError = failure as AlexaSimHttpError;
    expect(httpError.status).toBe(502);
    expect(httpError.code).toBe("llm_unavailable");
    expect(httpError.retryAfterSeconds).toBeNull();
  });
});
