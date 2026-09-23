# MCP

When implementing a server, read the optional
[MCP architecture reference](../.ai/skills/architecture-hexagonal/references/infrastructure/mcp-adapters.md).
Client configuration examples below do not implement a server.

MCP servers should be enabled only when they are useful for the current task.

## Included examples

- `context7`: retrieve library documentation.
- `playwright`: browser automation and E2E exploration.

## Recommendation

Keep MCP disabled by default in locked-down environments. Enable it per task or per agent profile.

## Security rule

Do not add MCP servers with broad permissions unless the team has reviewed their source, required credentials and data access.
