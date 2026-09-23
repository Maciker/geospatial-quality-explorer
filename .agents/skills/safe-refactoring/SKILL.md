---
name: safe-refactoring
description: Use when changing structure without changing external behavior.
---

# Safe Refactoring

Refactoring changes structure, not behavior.

## Rules

- Characterize existing behavior before changing risky code.
- Prefer small reversible steps.
- Keep tests green after each step.
- Do not mix refactor and feature behavior in the same commit.
- Use parallel change for public API migrations.

## Stop conditions

Stop and ask for approval if:

- A public contract must change.
- Tests are missing for risky behavior.
- The refactor expands beyond the approved plan.

## Broad contract migrations

Use expand → migrate → contract when a rename or type change would break many callers at once. First add a compatible form, then migrate caller groups while checks remain green, then remove the old form after verifying no callers remain. Record rollback at each stage. If independent green batches are impossible, use an explicitly scoped integration branch and a final integrate-and-verify task.

Before replacing fine-grained tests with tests at a deeper interface, map every behavior to retained coverage and demonstrate it still detects regressions. Test deletion must never hide a defect.

Adapted from Matt Pocock's `to-tickets` and `codebase-design`, and informed by the legacy/parallel-change concepts in the training index. See repository-root `THIRD_PARTY_NOTICES.md`.
