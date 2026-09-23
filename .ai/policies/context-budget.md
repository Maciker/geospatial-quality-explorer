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
- Task discovery produces `.ai/workspace/prds/*`.
- Planning produces `.ai/workspace/plans/*`.
- Execution produces `.ai/workspace/summaries/*`.
- Review produces `.ai/workspace/reviews/*`.
- Validation produces command evidence in summaries or validation artifacts.
