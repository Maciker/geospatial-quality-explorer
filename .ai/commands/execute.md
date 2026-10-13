Use the `executor` agent to execute the approved plan.

Plan: $ARGUMENTS

Rules:
- If given an issue identifier, read the complete issue and relevant comments through the configured tracker and state its identifier and title before starting. Resolve ambiguous references; do not infer task scope from the identifier alone.
- Follow the plan exactly.
- Use TDD for every logic change.
- One checklist item at a time.
- Mark progress in the plan file.
- Commit each completed Red-Green-Refactor cycle.
- Write a summary under `.ai/workspace/summaries/`.
