# Architecture

## Current shape
`packages/quality` holds the vector rules, the validation function, and the report/QGIS builders. `packages/persistence` is the PostGIS adapter. `apps/cli` and `apps/api` are delivery adapters. `apps/web` renders stored findings and starts loopback imports.

## Dependency direction
Infrastructure adapters depend on the quality package. Domain code does not import application, infrastructure, HTTP, filesystem, databases, or browser APIs. The geometry engine is injected as a port. CLI, API, and web share the validation function.

Domain code must not depend on application, infrastructure, HTTP, filesystem, databases or browser APIs. CLI, API and web reuse contracts/use cases instead of duplicating rules. TypeScript is the implementation language throughout; SQL and QGIS desktop assets are external tools, not alternate application runtimes.

## Planned boundaries
- Inputs are validated at adapters; preserve source metadata and stable IDs.
- Computation returns explicit results and limitations.
- Persistence/export adapters keep immutable provenance and distinguish incomplete runs.
- UI displays only recorded results; bounded requests and cancellation precede large inputs.

## Workflow
The imported `.ai/` skills are canonical. Generated vendor projections must be regenerated with `pnpm ai:sync`; validate with `pnpm quality:stabilization`. Architecture, lint, test, duplication, dead-code and ratchet checks include apps/packages. Upstream workflow manuals remain under docs and may describe the original boilerplate; this page and project-spec.md define this product's architecture.
