# Context Budget Policy

Context is a limited resource. Keep it fresh and task-focused.

## Rules

- Each phase produces a compact artifact.
- The next phase consumes the artifact, not the whole chat history.
- Start a clean session between large slices.
- Summarize long logs before passing them to an agent.
- Keep `AGENTS.md` slim and point to docs for details.
- Prefer file paths and short evidence over pasted walls of text.

## Artifact handoff

- Repo onboarding produces `.ai/workspace/repo-analysis/*`.
- Task discovery produces `.ai/workspace/tasks/<task-id>/discovery.md`.
- Planning produces `.ai/workspace/tasks/<task-id>/plan.md`.
- Execution produces `.ai/workspace/tasks/<task-id>/summary.md`.
- Review produces `.ai/workspace/tasks/<task-id>/review.md`.
- Validation produces command evidence in `.ai/workspace/tasks/<task-id>/validation.md` or the summary.
