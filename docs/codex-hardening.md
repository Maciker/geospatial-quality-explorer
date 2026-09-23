# Codex hardening

This profile optimizes the canonical `.ai/` workflow for Codex without making Codex the source of truth.

## Source of truth

```text
.ai/agents/     -> .codex/agents/*.toml
.ai/skills/     -> .agents/skills/*
.ai/mcp.json    -> .codex/config.toml MCP entries
AGENTS.md       -> .codex/AGENTS.md
```

Regenerate everything with:

```bash
pnpm ai:sync
pnpm quality:codex
```

## Project config

`.codex/config.toml` contains only project-safe settings:

```text
project_doc_max_bytes = 32768
[agents]
max_threads = 6
max_depth = 1
job_max_runtime_seconds = 1800
```

Do not put auth, model provider, telemetry, or personal approval policy in the repo. Those belong in user-level Codex config.

## Custom agents

Each `.ai/agents/*.md` file is converted into one `.codex/agents/*.toml` file with:

```text
name
description
developer_instructions
sandbox_mode
model_reasoning_effort
nickname_candidates
```

Default mapping:

| Agent type | Sandbox | Notes |
|---|---|---|
| `executor` | `workspace-write` | Implements approved plans only |
| `planner` / `debater` | `workspace-write` | Writes only `.ai/workspace` artifacts |
| reviewers | `read-only` | Report findings only |
| `validator` | `workspace-write` | May write `.quality` outputs |

## Hooks

`.codex/hooks.json` wires two lightweight project-local hooks:

| Event | Purpose |
|---|---|
| `PreToolUse` | Blocks obviously destructive shell commands and warns about generated vendor files or baseline edits |
| `PostToolUse` | Adds model-visible reminders when source/vendor files changed |

Hooks are guardrails, not a security boundary. Keep Git hooks, CI, ratchet, and review gates as the source of enforcement.

## Skill budget

Codex initially sees only skill names, descriptions, and paths before loading a selected `SKILL.md`. Keep descriptions concise and avoid redundant skills.

Check the estimated initial skill index with:

```bash
pnpm codex:skills:budget
```

The default budget is 8000 bytes. Override it when needed:

```bash
CODEX_SKILL_INDEX_BUDGET=12000 pnpm codex:skills:budget
```

## Operating rules

- Edit `.ai/` first, then run `pnpm ai:sync`.
- Do not edit `.codex/agents/*.toml` directly.
- Review and trust project hooks explicitly in Codex before relying on them.
- Keep agent fan-out shallow: `max_depth = 1`.
- Keep reviewers read-only.
- Use `pnpm quality:fast` after source changes and `pnpm quality:full` before PR.
