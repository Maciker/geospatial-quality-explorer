import { describe, expect, it } from "vitest";
import type { AlexaChatResponse } from "./alexaSimApi";
import { isAlexaSessionContextValid } from "./sessionContext";

const base = (): AlexaChatResponse => ({
  sessionId: "session-12345678",
  assistantMessage: "ok",
  findings: [],
  runId: "a".repeat(64),
  refused: false,
  qgisExport: null,
});

describe("isAlexaSessionContextValid", () => {
  it("keeps context for successful replies and refused replies that still have a run", () => {
    expect(isAlexaSessionContextValid(base())).toBe(true);
    expect(isAlexaSessionContextValid({ ...base(), refused: true })).toBe(true);
  });

  it("marks choose/revalidate refusals without a run as invalid context", () => {
    expect(
      isAlexaSessionContextValid({
        ...base(),
        runId: null,
        refused: true,
        findings: [],
        assistantMessage: "Ask me to validate an allowed fixture again.",
      }),
    ).toBe(false);
  });
});
