import { describe, expect, it } from "vitest";
import { computeRoundBudgetMs } from "../src/application/llmTurnBudget.js";

describe("computeRoundBudgetMs", () => {
  it("splits remaining time across outstanding LLM calls", () => {
    const budget = computeRoundBudgetMs({
      deadlineMs: 55_000,
      roundTimeoutCapMs: 24_000,
      llmCallsRemaining: 5,
      nowMs: 0,
    });
    expect(budget).toBe(11_000);
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
