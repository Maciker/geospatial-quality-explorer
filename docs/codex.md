# Codex adapter

Codex consumes the root `AGENTS.md` file as the durable project instruction contract. This adapter also projects the canonical `.ai/` workflow into Codex-native custom agents, hooks, MCP configuration, and portable skills.

## Generated structure

```text
.codex/
  config.toml
  AGENTS.md
  README.md
  agents/
    executor.toml
    planner.toml
    reviewer.toml
    ...
  hooks.json
  hooks/
    pre_tool_use_policy.mjs
    post_tool_use_quality_hint.mjs

.agents/
  skills/
```

## Usage

```bash
pnpm ai:sync
pnpm codex:check
pnpm codex:skills:budget
pnpm quality:codex
```

Then open the repo with Codex.

## What Codex gets

- `AGENTS.md`: repository-wide rules and workflow.
- `.agents/skills`: generated skills with progressive disclosure.
- `.codex/agents/*.toml`: custom agents generated from `.ai/agents`.
- `.codex/config.toml`: project-scoped subagent limits and MCP servers.
- `.codex/hooks.json`: lightweight safety and quality reminders.

## Policy

- `.ai/` is canonical.
- `.codex/` is generated.
- User-specific model/provider/auth/approval settings belong in user-level Codex config.
- Reviewers stay read-only.
- Executor edits production code only from an approved plan.
- Baselines never grow automatically.

See `docs/codex-hardening.md` for the detailed hardening profile.
