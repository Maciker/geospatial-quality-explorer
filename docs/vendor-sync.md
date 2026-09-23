# Vendor synchronization

The vendor sync step projects `.ai/` into Cursor, Codex, GitHub Copilot and Hermes Agent formats.

## Commands

```bash
pnpm ai:sync
pnpm vendors:check
pnpm quality:vendor
pnpm quality:codex
```

`quality:vendor` runs sync and then validates generated vendor assets.

## Source of truth

| Source | Generated target |
| --- | --- |
| `.ai/agents/*.md` | `.cursor/agents/*.md`, `.codex/agents/*.toml` |
| `.ai/skills/*` | `.cursor/skills/*`, `.agents/skills/*`, `.hermes/skills/*` |
| `.ai/commands/*.md` | `.github/prompts/*.prompt.md` |
| `.ai/mcp.json` | `.cursor/mcp.json`, `.codex/config.toml` |
| `AGENTS.md` | `.github/instructions/agent-guardrails.instructions.md`, `.codex/AGENTS.md`, `.hermes/AGENTS.md` |
| Codex hook policy | `.codex/hooks.json`, `.codex/hooks/*.mjs` |
| Hermes config template | `.hermes/config.yaml`, `.hermes/README.md` |

## When to run

Run sync after changing:

- `.ai/agents`
- `.ai/skills`
- `.ai/commands`
- `.ai/mcp.json`
- `AGENTS.md`
- vendor sync scripts

## Review policy

Generated vendor files are committed so each vendor works immediately after clone. Pull requests should include both the canonical `.ai/` change and generated vendor projections.
