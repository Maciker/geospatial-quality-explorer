Use the `executor` agent to execute the approved plan.

Plan: $ARGUMENTS

Rules:
- If given an issue identifier, read the complete issue and relevant comments through the configured tracker and state its identifier and title before starting. Resolve ambiguous references; do not infer task scope from the identifier alone.
- Do not start unless the plan's `Approval` section says `Status: approved` and names the approver.
- Follow the plan exactly.
- Use TDD for every logic change.
- One checklist item at a time.
- Mark progress in the plan file.
- Commit on green; commit refactors separately; never commit on red.
- Write a summary to `.ai/workspace/tasks/<task-id>/summary.md`.
