# Geospatial Quality Explorer

A local-first, open-source project for finding and explaining deterministic quality issues in geospatial vector data.

It is a portfolio project for modern geospatial engineering: QGIS and PyQGIS, PostgreSQL/PostGIS, Python, FastAPI, React, MapLibre, reproducible testing, and English technical communication.

## Product intent

A user will provide a small vector dataset and receive traceable findings such as invalid geometry, missing or empty geometry, duplicate identifiers, missing CRS metadata, and selected project-specific spatial rules. Findings can be inspected in QGIS and a browser.

Every finding must state its rule, source feature, severity, explanation, and suggested next action. The system must not infer a CRS, silently alter source data, or let an AI model decide spatial validity.

## Repository structure

- `apps/api` — FastAPI service and deterministic validation core.
- `apps/web` — React/TypeScript interface; MapLibre integration follows the findings-map issue.
- `infra` — local PostGIS development environment and schema.
- `qgis` — portable QGIS projects, Processing models, and PyQGIS scripts.
- `docs` — roadmap, weekly execution guide, architecture, and local development guide.

## Start here

1. Read the [roadmap](docs/roadmap.md).
2. Follow the [weekly execution guide](docs/weekly-guide.md) and complete issues sequentially.
3. For local setup, follow [development.md](docs/development.md).
4. Track product work in the MVP issues linked from the repository issue list.

## Current state

The repository contains an executable API health endpoint, an initial frontend/API contract, a local PostGIS schema, and development documentation. It does not yet ingest datasets, run validation rules, persist findings, or display a map. Those capabilities are intentionally delivered through separate, testable issues.
