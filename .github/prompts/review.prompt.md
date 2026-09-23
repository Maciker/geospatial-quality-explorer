---
description: "Review workflow from agent-guardrails-ts"
---

# Review

Read AGENTS.md first. Then follow this workflow.

Use the `reviewer` agent to validate the implementation.

Summary: $ARGUMENTS

Rules:
- Read-only.
- Compare against PRD, plan and AGENTS.md.
- Run safe inspection commands when needed.
- Write a review under `.ai/workspace/reviews/`.
