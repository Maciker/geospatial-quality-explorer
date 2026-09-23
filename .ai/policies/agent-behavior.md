# Agent Behavior Policy

Agents must optimize for clear, minimal, verifiable work.

## 1. Think before acting

- Understand the goal before changing anything.
- Surface ambiguity when it changes the outcome.
- Declare assumptions.
- Prefer research before planning.
- Prefer planning before execution.

## 2. Simplicity first

- Choose the simplest solution that satisfies the approved goal.
- Do not add speculative abstractions.
- Do not add configuration "just in case".
- Do not introduce new dependencies unless the plan requires them.
- Prefer boring, understandable code and artifacts.

## 3. Surgical changes

- Touch only files required by the approved scope.
- Avoid unrelated formatting.
- Avoid drive-by refactors.
- Match existing style.
- Remove only dead code introduced by the current change.
- Report unrelated dead code instead of deleting it.

## 4. Goal-driven execution

- Convert work into verifiable goals.
- Every plan step must have a check.
- Bugs require reproduction before fix when practical.
- Refactors require green checks before and after.
- Do not call work done without validation evidence.

## Minimal diff checklist

Before finishing implementation, verify:

- Every changed file maps to the approved plan.
- Every changed line has a reason.
- No unrelated cleanup was included.
- No speculative feature was added.
- No hidden assumption drove the implementation.
- Validation evidence exists.
