---
description: "Plan workflow from agent-guardrails-ts"
---

# Plan

Read AGENTS.md first. Then follow this workflow.

Use the `planner` agent to create an implementation plan.

Task or discovery: $ARGUMENTS

Rules:
- Do not implement.
- Inspect only the files needed to plan.
- Produce a checklist plan at `.ai/workspace/tasks/<task-id>/plan.md` from `.ai/templates/tasks/plan.md`, with `Status: proposed`.
- Wait for explicit approval before execution. Only the human's answer sets `Status: approved`, `Approved by` and `Approved at`.
