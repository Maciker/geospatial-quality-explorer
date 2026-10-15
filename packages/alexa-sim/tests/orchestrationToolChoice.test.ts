import { describe, expect, it } from "vitest";
import { forcedToolForTurn, toolChoiceForTurn } from "../src/application/orchestrationToolChoice.js";
import type { ChatMessage } from "../src/domain/chatTypes.js";

describe("orchestrationToolChoice", () => {
  it("requires list_fixtures before validation when there is no session", () => {
    const transcript: ChatMessage[] = [{ role: "user", content: "Validate the portfolio fixture." }];
    expect(forcedToolForTurn(transcript, "")).toBe("list_fixtures");
    expect(toolChoiceForTurn(transcript, "", 0)).toEqual({
      type: "function",
      function: { name: "list_fixtures" },
    });
  });

  it("requires run_validation when the session exists and the user asks to validate", () => {
    const transcript: ChatMessage[] = [{ role: "user", content: "Please validate the portfolio fixture." }];
    expect(forcedToolForTurn(transcript, "sess-123")).toBe("run_validation");
  });

  it("forces validation for a catalog fixture id even without the word fixture", () => {
    const transcript: ChatMessage[] = [{ role: "user", content: "Validate ne-admin0-westeurope." }];
    expect(forcedToolForTurn(transcript, "")).toBe("list_fixtures");
    expect(forcedToolForTurn(transcript, "sess-123")).toBe("run_validation");
  });

  it("does not force tools after a tool result on the same turn", () => {
    const transcript: ChatMessage[] = [
      { role: "user", content: "Validate the portfolio fixture." },
      { role: "tool", content: "{}", toolCallId: "t1" },
    ];
    expect(forcedToolForTurn(transcript, "sess-123")).toBeNull();
    expect(toolChoiceForTurn(transcript, "sess-123", 0)).toBe("auto");
  });

  it.each([
    ["Explain the next finding.", "explain_finding"],
    ["Why is that one a problem? Explain it.", "explain_finding"],
    [
      `Explain finding ${"a".repeat(64)}:16:geometry.invalid.`,
      "explain_finding",
    ],
    ["Export QGIS.", "export_qgis"],
    ["Download the QGIS bundle please", "export_qgis"],
  ])("forces the tool for %s once a session exists", (content, tool) => {
    const transcript: ChatMessage[] = [{ role: "user", content }];
    expect(forcedToolForTurn(transcript, "sess-123")).toBe(tool);
    expect(forcedToolForTurn(transcript, "")).toBeNull();
  });

  it.each([
    ["Can you export the QGIS bundle?", "export_qgis"],
    ["OK, now please list the findings.", "list_findings"],
    ["Could you validate the portfolio fixture?", "run_validation"],
    ["Hi, validate the portfolio fixture.", "run_validation"],
    ["Yes, export QGIS.", "export_qgis"],
  ])("treats a polite request as a command: %s", (content, tool) => {
    expect(forcedToolForTurn([{ role: "user", content }], "sess-123")).toBe(tool);
  });

  it.each([
    "explain how export works",
    "Don't export yet.",
    "What does the QGIS export contain?",
    "Which portfolio features are invalid?",
    "Don't validate the portfolio.",
    "explain what a self-intersection is",
    "Do not list the findings, just tell me the run id.",
  ])("does not force a tool for a question, negation or concept: %s", (content) => {
    expect(forcedToolForTurn([{ role: "user", content }], "sess-123")).toBeNull();
  });
});
