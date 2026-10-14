# Geospatial Quality Explorer

Validate a small vector dataset, keep traceable findings, and review them in a browser, by conversation, or in QGIS.

## The problem

Before a polygon layer is published or shared, someone has to check it: are geometries valid, are feature ids present and unique, is the CRS what the file claims? Desktop tools answer this one layer at a time and leave no record of *which* file, *which* rules and *which* version produced a finding.

Geospatial Quality Explorer runs a fixed, versioned ruleset over a GeoJSON dataset and records every finding with the source file hash, declared CRS, license and ruleset version. The same input always yields the same run id and the same findings. Source data is never modified.

**Who it is for:** GIS analysts and data stewards who review vector deliveries, and reviewers who want an auditable quality report they can open in QGIS.

## What you can demo

| Surface | What it shows | Needs |
| --- | --- | --- |
| **Alexa+ simulation** (`?sim=alexa`) | Ask in natural language (typed or spoken) to validate a fixture, list and explain findings, and export a QGIS bundle. Every claim cites `findingId`, `ruleId` and `featureId` from the deterministic core; the model never judges geometry. | Node only. A `NAN_API_KEY` switches from the scripted mock to a live LLM. |
| **Run review** (browser) | Map and list of stored findings with provenance, filters, keyboard navigation and GeoJSON import. | Node + PostGIS |
| **CLI** | `pnpm gis validate` → JSON report, QGIS bundle (`findings.qgs`, `.qml`, GeoJSON). | Node (PostGIS optional) |

> The Alexa+ experience is a **labeled web simulation**, not an Amazon product or certified Alexa skill. See [ADR 001](docs/hackathon/adr-001-alexa-simulation.md).

## Quick start (2 minutes, no database, no API key)

Use Node.js 22 or 24. pnpm 10.17.1 is pinned and provided by Corepack.

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev:api        # terminal 1: loopback API on 127.0.0.1:8000
pnpm dev:web        # terminal 2: prints the Vite URL
```

Open the Vite URL with `?sim=alexa` and send, in order: `Validate the portfolio fixture.`, `List the findings.`, `Explain the next finding.`, `Export QGIS.` The badge says whether the deterministic mock or a live model answered.

CLI only:

```sh
pnpm gis validate --input packages/quality/fixtures/vector/portfolio.geojson \
  --source-crs EPSG:4326 --name portfolio --license CC0-1.0 --output outputs/portfolio-report.json
pnpm gis export qgis --input outputs/portfolio-report.json --output outputs/qgis
```

`validate` exits `2` because the portfolio fixture intentionally contains findings. Open `outputs/qgis/findings.qgs` in QGIS 3.

The full path with PostGIS and the browser review is in [the five-minute demo](docs/demo.md). Configuration variables are listed in [`.env.example`](.env.example); nothing loads it automatically.

## What the rules check

Ruleset `vector-core` 1.1.0 reports empty geometry, missing and duplicate feature ids, unsupported geometry types, and invalid Polygon/MultiPolygon geometry (open, short or zero-area rings, self-intersections, holes outside, touching or overlapping, overlapping or edge-sharing parts).

- **CRS is never guessed.** `--source-crs` is required; a GeoJSON `crs` member is rejected; `EPSG:4326` coordinates outside ±180/±90 are rejected. Only `EPSG:4326` geometries are copied into RFC 7946 output.
- **Bounded inputs:** 1 MiB, 500 features, 10,000 positions per ring.
- **Not a certificate.** No attribute, positional-accuracy or between-feature topology checks. See [limitations](docs/limitations.md).

## Data and licenses

The fixtures in `packages/quality/fixtures/vector` are original synthetic geometries dedicated to the public domain (CC0 1.0). The map has no remote basemap, so no tile terms apply. Code is MIT ([LICENSE](LICENSE)); third-party notices are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). Real datasets and generated outputs stay local (`outputs/`, `data/raw/` are ignored).

## Technology choices

TypeScript on Node.js for the validator, CLI, API and React/MapLibre web app; PostGIS for durable runs and spatial indexing; QGIS as the desktop review tool. The validation core sits behind a `GeometryEngine` port, so it can be swapped for GEOS/PostGIS `ST_IsValidDetail` without touching rules or adapters. There is no Python runtime.

## Hosted demo

`vercel.json` deploys the simulation only (`VITE_APP_MODE=alexa-only`) with a serverless chat function. Set `NAN_API_KEY` and a provider spend limit in the Vercel project before sharing the URL; see [development](docs/development.md#hosted-demo-vercel).

## Project docs

[Demo](docs/demo.md) · [CLI](docs/cli.md) · [API](docs/api.md) · [QGIS review](docs/qgis-review.md) · [Contracts](docs/contracts.md) · [Limitations](docs/limitations.md) · [Architecture](docs/architecture.md) · [Development](docs/development.md) · [Roadmap](docs/roadmap.md) · [Alexa+ tool contracts](docs/hackathon/tool-contracts.md)

## How this repository is built

Changes follow an agent-guided workflow (discovery → plan → TDD → deterministic gates → independent review → human approval), vendored from [agent-workflow-code-ts](https://github.com/Maciker/agent-workflow-code-ts) with provenance in [docs/workflow-provenance.json](docs/workflow-provenance.json). Contributors and agents start at [AGENTS.md](AGENTS.md) and [CONTRIBUTING.md](CONTRIBUTING.md). The quality gate is:

```sh
pnpm quality:full          # typecheck, lint, tests, architecture, dead code, duplication, ratchet
pnpm test:e2e              # Playwright, needs PostGIS (see docs/development.md)
```

CI runs both on Node 22 and 24 with a PostGIS service.
