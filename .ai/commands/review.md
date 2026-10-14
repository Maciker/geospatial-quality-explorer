Use the `reviewer` agent to validate the implementation.

Task or summary: $ARGUMENTS

Rules:
- Read-only.
- Compare against the task's discovery, plan and AGENTS.md.
- Run safe inspection commands when needed.
- Write the review to `.ai/workspace/tasks/<task-id>/review.md`.
