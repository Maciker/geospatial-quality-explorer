# Vendor adapter profile

Use this profile when maintaining Cursor, Codex, GitHub Copilot, or Hermes Agent projections.

## Canonical source

`.ai/` remains the source of truth.

## Commands

```bash
pnpm ai:sync
pnpm vendors:check
pnpm quality:vendor
```

## Rules

- Do not hand-edit generated vendor files unless changing the adapter generator.
- Commit regenerated vendor files with the canonical `.ai/` change.
- Do not place secrets in `.cursor/mcp.json`, `.codex/config.toml`, `.github/*`, `.hermes/config.yaml`, or `.ai/mcp.json`. Hermes API keys belong in `~/.hermes/.env`.
- Cursor reviewers must be read-only. Only `debater`, `planner`, and `executor` are write-capable in Cursor; only `executor` may change production code.
