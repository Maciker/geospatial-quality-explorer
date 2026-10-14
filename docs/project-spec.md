# Geospatial Quality Explorer: bounded MVP

## Outcome
Validate a small vector dataset, save traceable findings in PostGIS, and inspect them in QGIS and a browser.

## MVP delivered by this branch
A developer can validate the CC0 fixtures, store a run in PostGIS, read a bounded GeoJSON page, export a QGIS bundle and a provenance report, and review or import a dataset in the browser.

## Constraints
- TypeScript application code, Node 22/24, pnpm workspaces.
- Deterministic spatial/numerical results; never use an LLM as a geometry or accuracy oracle.
- Preserve CRS, units, NoData, source hashes, identifiers and licenses.
- Reject unsupported operations explicitly; never infer an authoritative CRS or silently repair inputs.
- Local demo first, bounded inputs and resources; no hosted service, billing or automatic publishing.

## Acceptance source
[Tracker #8](https://github.com/Maciker/geospatial-quality-explorer/issues/8) is the authoritative product backlog. Each linked ticket provides a vertical user outcome, dependencies and testable acceptance criteria.

## Workflow references
Use gis-data-integrity for rules, CRS, fixtures and exports, domain-modeling for contracts, architecture-hexagonal for ports/adapters, xp-tdd-practices and testing-standards for behavior, frontend-patterns for React, git-strategy for branches and qa-review for independent review. See canonical `.ai/skills/*/SKILL.md` and `.ai/commands/to-spec.md`, `to-tickets.md`.
