---
description: "Review workflow from agent-guardrails-ts"
---

# Review

Read AGENTS.md first. Then follow this workflow.

Use the `reviewer` agent to validate the implementation.

Task or summary: $ARGUMENTS

Rules:
- Read-only.
- Compare against the task's discovery, plan and AGENTS.md.
- Run safe inspection commands when needed.
- Write the review to `.ai/workspace/tasks/<task-id>/review.md`.
