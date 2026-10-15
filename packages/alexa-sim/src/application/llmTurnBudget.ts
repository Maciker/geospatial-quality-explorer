/**
 * Per-call LLM budget: never exceed remaining turn time or the configured cap, and keep enough for
 * one more call. Most turns need one or two calls, so splitting across every possible round would
 * starve the first call.
 */
export function computeRoundBudgetMs(input: {
  readonly deadlineMs: number;
  readonly roundTimeoutCapMs: number;
  readonly llmCallsRemaining: number;
  readonly nowMs?: number;
}): number {
  const nowMs = input.nowMs ?? Date.now();
  const remainingMs = input.deadlineMs - nowMs;
  if (remainingMs <= 0) return 0;
  const fairShareMs = Math.floor(remainingMs / Math.min(2, Math.max(1, input.llmCallsRemaining)));
  return Math.min(remainingMs, input.roundTimeoutCapMs, Math.max(fairShareMs, 1));
}
