# Cursor adapter

Cursor consumes a generated `.cursor/` directory.

## Generated structure

```text
.cursor/
  rules/
    00-agent-workflow.mdc
    10-architecture-hexagonal.mdc
    20-design-principles.mdc
    30-testing-standards.mdc
    40-xp-tdd.mdc
    50-frontend-patterns.mdc
    60-openspec.mdc
  agents/
  skills/
  mcp.json
```

## Usage

```bash
pnpm ai:sync
pnpm vendors:check
```

Open the repository in Cursor. Cursor should see the rules, subagents, skills and project MCP config.

## Rule activation

- `00-agent-workflow.mdc` is always applied.
- Architecture, design and testing rules are scoped by globs.
- XP/TDD is description-based and loaded when relevant.
- Frontend and OpenSpec rules are optional profiles.

## Agent policy

Generated Cursor subagents are read-only except `debater`, `planner`, and `executor`.

- Read-only agents report findings only.
- `debater` and `planner` may write workspace artifacts such as PRDs and plans.
- `executor` applies approved implementation work and is the only production write-capable agent.
- Review findings must become an approved plan before code is changed.

## MCP

`.cursor/mcp.json` is generated from `.ai/mcp.json` and includes Context7 and Playwright. Keep secrets in environment variables, not in the repo.
