---
description: "Test Review workflow from agent-guardrails-ts"
---

# Test Review

Read AGENTS.md first. Then follow this workflow.

Use the `test-reviewer` agent to review test quality and coverage.

Scope: $ARGUMENTS

Rules:
- Read-only review.
- Check naming, AAA, FIRST, mocks, coverage by layer, and secret-safety.
- Do not weaken or modify tests.
