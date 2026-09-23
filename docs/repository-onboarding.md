# Repository Onboarding

Use repository onboarding before applying this workflow to an existing codebase.

## When to use it

Run `/repo-discovery` when:

- the agent has never worked in the repository;
- the repository has weak or outdated documentation;
- validation commands are unclear;
- the architecture is unknown;
- you want to update `AGENTS.md` from observed facts.

## Flow

```text
/repo-discovery -> repository-analyst -> .ai/workspace/repo-analysis/*
```

`/repo-discovery` is different from `/discovery`:

- `/repo-discovery` maps the repository.
- `/discovery` explores a specific product or engineering task.

## Output artifacts

The repository analyst writes:

```text
.ai/workspace/repo-analysis/repo-map.md
.ai/workspace/repo-analysis/validation-map.md
.ai/workspace/repo-analysis/architecture-map.md
.ai/workspace/repo-analysis/risk-map.md
.ai/workspace/repo-analysis/agent-onboarding.md
.ai/workspace/repo-analysis/suggested-agents-update.md
```

## Adoption checklist

1. Run `/repo-discovery`.
2. Review `suggested-agents-update.md` manually.
3. Copy stable facts into `AGENTS.md`.
4. Run the recommended validation commands.
5. Start a small real task with `/discovery`.

## Guardrails

- Do not edit production code during repository onboarding.
- Do not install dependencies unless explicitly approved.
- Do not treat hypotheses as facts.
- Do not create broad refactor plans during onboarding.
