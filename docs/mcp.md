# MCP

When implementing a server, read the optional
[MCP architecture reference](../.ai/skills/architecture-hexagonal/references/infrastructure/mcp-adapters.md).
Client configuration examples below do not implement a server.

## What is enabled

`.ai/mcp.json` is projected by `pnpm ai:sync` into project configuration that Cursor (`.cursor/mcp.json`) and Codex (`.codex/config.toml`) read when they open this repository. Both servers below are therefore configured by default for those tools:

- `context7`: retrieves library documentation. It calls an external service and reads `CONTEXT7_API_KEY` from the environment when set.
- `playwright`: browser automation and E2E exploration, started with `--isolated`.

Both run through `npx -y` with pinned package versions, so the first start downloads and executes those npm packages. Whether a tool asks for confirmation before starting a project MCP server depends on that tool and its settings; check it before relying on it.

## Disable or restrict

In locked-down environments, remove the entries from `.ai/mcp.json` (keep `{ "mcpServers": {} }`), run `pnpm ai:sync`, and enable servers per task or in user-level configuration instead. The Codex adapter check (`pnpm codex:check`) currently expects both entries; update `tools/vendors/check-codex-adapter.mjs` in the same change.

## Security rule

Do not add MCP servers with broad permissions unless the team has reviewed their source, required credentials and data access. Keep versions pinned; never use `@latest`.
