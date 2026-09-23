# Codex profile

Use when the repo is opened with Codex CLI, IDE extension, or app.

## Commands

```bash
pnpm ai:sync
pnpm codex:check
pnpm codex:skills:budget
pnpm quality:codex
```

## Generated targets

```text
.codex/config.toml
.codex/agents/*.toml
.codex/hooks.json
.codex/hooks/*.mjs
.codex/AGENTS.md
.agents/skills/*
```

## Guardrails

- Custom reviewer agents are read-only.
- Planner and debater write only `.ai/workspace` artifacts.
- Executor is the only implementation agent.
- Project hooks block destructive shell commands and warn about generated vendor edits.
- The initial skill index must stay under the configured Codex budget.
