import { describe, expect, it } from "vitest";
import { boundedHistory } from "./boundedHistory";

describe("boundedHistory", () => {
  it("keeps the newest messages within the server message cap", () => {
    const messages = Array.from({ length: 50 }, (_, index) => ({ role: "user" as const, content: `m${index}` }));

    const bounded = boundedHistory(messages);

    expect(bounded).toHaveLength(40);
    expect(bounded.at(-1)?.content).toBe("m49");
  });

  it("truncates long messages and keeps the request under the body limit", () => {
    const messages = Array.from({ length: 30 }, () => ({ role: "assistant" as const, content: "x".repeat(9_000) }));
    messages.push({ role: "assistant", content: "latest" });

    const bounded = boundedHistory(messages);

    expect(bounded.every((message) => message.content.length <= 4_000)).toBe(true);
    expect(JSON.stringify({ messages: bounded }).length).toBeLessThan(60_000);
    expect(bounded.at(-1)?.content).toBe("latest");
  });
});
