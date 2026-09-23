# Architecture

## Current scaffold
A Node HTTP API serves /health and an empty /api/v1/findings scaffold; React consumes the contract through a Vite proxy. Validation, persistence, imports and the map are pending.

## Dependency direction
`apps/` contains entry points and delivery adapters. `packages/domain/` contains pure computational behavior (Quality currently has no domain rules). Application use cases and ports will be introduced with the first vertical slices, with infrastructure adapters depending on those ports. Do not add speculative interfaces to the scaffold.

Domain code must not depend on application, infrastructure, HTTP, filesystem, databases or browser APIs. CLI, API and web reuse contracts/use cases instead of duplicating rules. TypeScript is the implementation language throughout; SQL and QGIS desktop assets are external tools, not alternate application runtimes.

## Planned boundaries
- Inputs are validated at adapters; preserve source metadata and stable IDs.
- Computation returns explicit results and limitations.
- Persistence/export adapters keep immutable provenance and distinguish incomplete runs.
- UI displays only recorded results; bounded requests and cancellation precede large inputs.

## Workflow
The imported `.ai/` skills are canonical. Generated vendor projections must be regenerated with `pnpm ai:sync`; validate with `pnpm quality:stabilization`. Architecture, lint, test, duplication, dead-code and ratchet checks include apps/packages. Upstream workflow manuals remain under docs and may describe the original boilerplate; this page and project-spec.md define this product's architecture.
