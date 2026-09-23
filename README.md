# Geospatial Quality Explorer

Validate a small vector dataset, save traceable findings in PostGIS, and inspect them in QGIS and a browser.

## Current state

A Node HTTP API serves /health and an empty /api/v1/findings scaffold; React consumes the contract through a Vite proxy. Validation, persistence, imports and the map are pending. This is a foundation, not a completed GIS product.

All application, CLI and API code uses TypeScript on Node.js. QGIS desktop and PostGIS SQL remain GIS tools. There is no Python, FastAPI or PyQGIS runtime.

## Start

Use Node.js 22 or 24 and pnpm 10.17.1 (pinned in package.json).

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm quality:fast
pnpm build
```

See [local development](docs/development.md), [project specification](docs/project-spec.md), [architecture](docs/architecture.md) and [roadmap](docs/roadmap.md).

## Agent workflow

Canonical instructions and skills are in `.ai/`, with generated adapters for Cursor, Codex, Copilot and Hermes. OpenCode can read root `AGENTS.md` and the named skill files explicitly. No automatic OpenCode discovery is assumed.

Imported from [agent-workflow-code-ts](https://github.com/Maciker/agent-workflow-code-ts/tree/97d01f03436cbbf35936c172008e74e55be56dd5). The pin, upstream MIT attribution and local adaptations are recorded in [workflow provenance](docs/workflow-provenance.json). This is a vendored snapshot: upstream changes require a reviewed update and regeneration, not a floating dependency on main.

Run `pnpm quality:full` and `pnpm quality:stabilization` before review. Independent cross-model QA and human approval are merge requirements. Provider credentials are optional for local deterministic checks.

## Work order

Start with [foundation #9](https://github.com/Maciker/geospatial-quality-explorer/issues/9), then follow [MVP tracker #8](https://github.com/Maciker/geospatial-quality-explorer/issues/8). Tickets specify dependencies, acceptance tests and relevant skills. No feature is complete merely because its ticket exists.

Keep source data immutable. Only tiny, licensed fixtures belong in Git; real datasets and generated outputs stay local.
