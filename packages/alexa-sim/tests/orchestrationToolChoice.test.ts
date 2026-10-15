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
    ["Export QGIS.", "export_qgis"],
    ["Download the QGIS bundle please", "export_qgis"],
  ])("forces the tool for %s once a session exists", (content, tool) => {
    const transcript: ChatMessage[] = [{ role: "user", content }];
    expect(forcedToolForTurn(transcript, "sess-123")).toBe(tool);
    expect(forcedToolForTurn(transcript, "")).toBeNull();
  });
});
