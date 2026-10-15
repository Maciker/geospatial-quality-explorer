import { describe, expect, it } from "vitest";
import { computeRoundBudgetMs } from "../src/application/llmTurnBudget.js";

describe("computeRoundBudgetMs", () => {
  it("reserves time for at most one more call after this one", () => {
    const budget = computeRoundBudgetMs({
      deadlineMs: 45_000,
      roundTimeoutCapMs: 24_000,
      llmCallsRemaining: 5,
      nowMs: 0,
    });
    expect(budget).toBe(22_500);
  });

  it("never exceeds the configured per-round cap", () => {
    const budget = computeRoundBudgetMs({
      deadlineMs: 55_000,
      roundTimeoutCapMs: 24_000,
      llmCallsRemaining: 1,
      nowMs: 0,
    });
    expect(budget).toBe(24_000);
  });
});
