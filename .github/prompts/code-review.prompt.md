---
description: "Code Review workflow from agent-guardrails-ts"
---

# Code Review

Read AGENTS.md first. Then follow this workflow.

Use the `code-reviewer` agent to review the specified TypeScript scope.

Scope: $ARGUMENTS

Rules:
- Read-only review.
- Use the narrowest scope possible.
- Do not modify files.
- Return actionable findings with file, severity, reason, and suggested fix.
