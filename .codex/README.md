# Codex adapter

This directory is generated from .ai/ by `pnpm ai:sync`.

## Contents

- `AGENTS.md`: copy of the root project instruction contract.
- `config.toml`: project-scoped Codex config with subagent limits and MCP servers.
- `agents/*.toml`: Codex custom agents generated from .ai/agents.
- `hooks.json` and `hooks/*.mjs`: lightweight repository guardrails for dangerous commands, generated vendor edits, and quality hints.

Do not put personal credentials in this directory. Prefer environment variables and user-level Codex config.
