import { describe, expect, it } from "vitest";
import { describeLlmStep } from "../src/application/llmStepLabel.js";
import type { ChatMessage } from "../src/domain/chatTypes.js";

describe("describeLlmStep", () => {
  it("names the tool without embedding tool payload text", () => {
    const transcript: ChatMessage[] = [
      { role: "user", content: "Validate portfolio." },
      {
        role: "assistant",
        content: "",
        toolCalls: [{ id: "tc1", name: "run_validation", argumentsJson: "{}" }],
      },
      {
        role: "tool",
        content: JSON.stringify({ ok: true, sessionId: "secret-session", data: { runId: "abc" } }),
        toolCallId: "tc1",
      },
    ];

    const label = describeLlmStep(transcript, 1);

    expect(label).toBe("turn 2 after tool run_validation");
    expect(label).not.toContain("secret-session");
    expect(label).not.toContain("sessionId");
  });

  it("does not log a tool name the model invented", () => {
    const transcript: ChatMessage[] = [
      { role: "user", content: "Validate portfolio." },
      { role: "assistant", content: "", toolCalls: [{ id: "tc1", name: "leak sk-123 here", argumentsJson: "{}" }] },
    ];

    expect(describeLlmStep(transcript, 1)).toBe("turn 2 after assistant tool_calls unknown");
  });
});
