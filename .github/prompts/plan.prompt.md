---
description: "Plan workflow from agent-guardrails-ts"
---

# Plan

Read AGENTS.md first. Then follow this workflow.

Use the `planner` agent to create an implementation plan.

PRD: $ARGUMENTS

Rules:
- Do not implement.
- Inspect only the files needed to plan.
- Produce a checklist plan under `.ai/workspace/plans/`.
- Wait for explicit approval before execution.
