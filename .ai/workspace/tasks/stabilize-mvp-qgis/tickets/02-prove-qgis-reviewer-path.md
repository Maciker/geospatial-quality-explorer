# 02: Prove the QGIS reviewer path on the portfolio fixture

## Parent and source

- Parent task: [stabilize-mvp-qgis](../index.md)
- Linear: [MAC-52](https://linear.app/maciker/issue/MAC-52) (parent [MAC-50](https://linear.app/maciker/issue/MAC-50))
- Decision: [ADR 0004](../../../../../docs/adr/0004-post-mvp-stabilization.md)
- Walkthrough: [`docs/qgis-review.md`](../../../../../docs/qgis-review.md), [`docs/demo.md`](../../../../../docs/demo.md)
- Fixture: `packages/quality/fixtures/vector/portfolio.geojson`

## What this slice delivers

A QGIS reviewer can validate the CC0 portfolio fixture, export a QGIS bundle for that run, and inspect findings (severity / ruleId) without PyQGIS — with recorded evidence of what was checked and what remains owner-visual.

## Acceptance criteria

- [ ] From a clean local setup matching the demo prerequisites, `pnpm gis validate` on the portfolio fixture produces a run id and stores the run (PostGIS when available; record if only in-memory/CLI path was exercised).
- [ ] `pnpm gis export qgis --run-id <id> --output <dir>` writes `findings.geojson`, `findings.qgs`, `findings.qml`, and run metadata in the same folder.
- [ ] Bundle contents match [`docs/qgis-review.md`](../../../../../docs/qgis-review.md): relative `./findings.geojson` datasource, severity categorization, declared CRS / limitations present in metadata.
- [ ] Evidence is written to this task’s `findings.md` (commands, run id, file list, XML/OGR checks, any doc mismatches).
- [ ] Desktop QGIS visual open is either performed and noted, or explicitly marked **owner-owned** if QGIS desktop is unavailable in the agent environment.

## Verification

```sh
docker compose -f infra/docker-compose.yml up -d db
export GEOSPATIAL_POSTGIS_URL=postgres://explorer:explorer@127.0.0.1:5432/geospatial_quality_explorer
pnpm gis migrate
pnpm gis validate --input packages/quality/fixtures/vector/portfolio.geojson --source-crs EPSG:4326 --name portfolio --license CC0-1.0
pnpm gis export qgis --run-id <run-id> --output outputs/qgis-rehearsal
# Inspect outputs/qgis-rehearsal/{findings.geojson,findings.qgs,findings.qml} and metadata
```

Automated: existing `packages/quality` delivery tests for `buildQgisBundle` remain green. Manual: open `findings.qgs` in QGIS 3 when available.

## Blocked by

None. The CLI `gis` entry already uses `tsx`; this path does not depend on ticket 01.

## Scope and exclusions

- In scope: rehearsal, evidence capture, and listing concrete doc/code gaps found.
- Out of scope: new geometry rules, CRS reprojection, basemaps, styling polish beyond documenting gaps, browser map work, and fixing issues that need a separate diagnosis/plan.

## Status and evidence

ready — primary slice for the agreed QGIS reviewer persona.
