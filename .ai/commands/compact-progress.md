Use the `context-manager` agent.

Task or scope: $ARGUMENTS

Goal:
Compact the current task context into a durable progress artifact for a fresh session.

Rules:
- Write only under `.ai/workspace/`.
- Do not edit production code.
- Do not hide failing checks or blockers.
- Do not include long raw logs; summarize them and cite paths.
- Keep the output concise and actionable.

Inputs to inspect when present:
- `.ai/workspace/tasks/<task-id>/research.md`
- `.ai/workspace/tasks/<task-id>/discovery.md`
- `.ai/workspace/tasks/<task-id>/plan.md`
- `.ai/workspace/tasks/<task-id>/findings.md`
- `.ai/workspace/tasks/<task-id>/validation.md`
- `.ai/workspace/tasks/<task-id>/summary.md`
- `.ai/workspace/tasks/<task-id>/review.md`
- recent command output or diagnostics logs if relevant

Output:
Create or update:

`.ai/workspace/tasks/<task-id>/progress.md`

The output must include:
1. Goal.
2. Current approach.
3. Completed steps.
4. Current state.
5. Current failing check or blocker.
6. Relevant files.
7. Decisions.
8. Risks.
9. Next recommended step.
10. Context to carry forward.
