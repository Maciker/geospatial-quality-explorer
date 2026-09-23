# Repository layout

```text
.ai/                  canonical agent configuration and generated workspace
.agents/              portable agent skills generated from .ai/skills
.azure/               Azure DevOps pipeline templates
.codex/               Codex project adapter generated from .ai and AGENTS.md
.cursor/              Cursor rules, agents, skills and MCP generated from .ai
.githooks/            pure Git hooks used by setup:hooks
.github/              GitHub Copilot instructions, path instructions and prompts
docs/                 operational documentation
quality/              quality config, schemas, profiles and baselines
scripts/              setup and vendor sync scripts
tools/quality/        deterministic quality runner and parsers
tools/qa/             cross-model QA input, validation and gate tools
tools/vendors/        vendor adapter sync and validation tools
tools/stabilization/  dogfooding and smoke-check tooling
src/                  example TypeScript package source
test/                 example tests
```

## Source of truth

`.ai/` is the canonical source for agents, commands, skills, prompts, MCP and workflow assets.

Generated vendor-specific files must be regenerated through:

```bash
pnpm ai:sync
pnpm vendors:check
```

Do not edit generated files under `.cursor/`, `.codex/`, `.agents/skills`, `.github/instructions`, or `.github/prompts` unless you are updating the vendor adapter itself.

## Workspace policy

Generated workflow artifacts live under `.ai/workspace/`.

Commit examples and templates, but avoid committing task-specific repo-analysis, PRDs, plans, summaries or QA reviews unless your team wants an auditable history for that work.

## Profiles

```text
quality/profiles/
  core.md
  react.md
  browser-qa.md
  fullstack.md
  openspec.md
  trust-model.md
```

Optional framework-specific rules belong in profiles, not in the global `AGENTS.md`.

## Vendor adapters

| Vendor | Adapter files |
| --- | --- |
| Cursor | `.cursor/rules`, `.cursor/agents`, `.cursor/skills`, `.cursor/mcp.json` |
| Codex | `.codex/config.toml`, `.codex/AGENTS.md`, `.agents/skills` |
| GitHub Copilot | `.github/copilot-instructions.md`, `.github/instructions`, `.github/prompts` |

See `docs/vendors.md` for the sync policy.
