import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BoundedSessionQualityToolsAdapter } from "../../alexa-tools/src/infrastructure/BoundedSessionQualityToolsAdapter.js";
import { ConversationalLoop } from "../src/application/ConversationalLoop.js";
import type { LlmCompletionRequest, LlmCompletionResponse, LlmPort } from "../src/application/LlmPort.js";

const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../quality/fixtures/vector");

function slowLlm(delayMs: number, inner: LlmPort): LlmPort {
  return {
    async complete(request: LlmCompletionRequest): Promise<LlmCompletionResponse> {
      await new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, delayMs);
        request.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      });
      return inner.complete(request);
    },
  };
}

describe("ConversationalLoop with a slow live-style model", () => {
  it("times out per round instead of waiting for three slow rounds to finish", async () => {
    const inner: LlmPort = {
      async complete(): Promise<LlmCompletionResponse> {
        return {
          finishReason: "tool_calls",
          message: {
            role: "assistant",
            content: "",
            toolCalls: [{ id: "slow", name: "list_fixtures", argumentsJson: "{}" }],
          },
        };
      },
    };
    const loop = new ConversationalLoop({
      tools: new BoundedSessionQualityToolsAdapter({ fixturesDirectory }),
      llm: slowLlm(80, inner),
      timeoutMs: 200,
      roundTimeoutMs: 60,
      maxToolRounds: 8,
    });

    const started = Date.now();
    const response = await loop.run({ messages: [{ role: "user", content: "List fixtures." }] });
    const elapsed = Date.now() - started;

    expect(response.refused).toBe(true);
    expect(response.assistantMessage.toLowerCase()).toContain("timed out");
    expect(elapsed).toBeLessThan(400);
  });
});
