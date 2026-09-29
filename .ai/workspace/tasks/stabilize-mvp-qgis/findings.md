# Findings: QGIS reviewer path rehearsal (MAC-52)

Date: 2026-09-29  
Environment: Cursor Cloud Agent (`bc-01a0ef35-a71e-72c4-a2ff-86944d14174f`), Node 22.14.0, pnpm 10.17.1  
Branch base: `main` @ `ece07a7` (includes MAC-51 `dev:api` tsx fix)

## Demo order (target 4–5 minutes)

1. CLI validate portfolio fixture → run id + report
2. Browser: open same run (`pnpm dev:api` + `pnpm dev:web` + `?run=<id>`) — **not exercised here** (no Docker/PostGIS)
3. Export QGIS bundle from that run
4. Open `findings.qgs` in QGIS Desktop — **owner-owned** (QGIS 3 not installed in this environment)

Observed CLI validate + export wall time: ~1s total (well under the one-second fixture bound for validate alone).

## Commands run

```sh
pnpm install --frozen-lockfile
# First pass: no Docker. Report-file path:
pnpm gis validate \
  --input packages/quality/fixtures/vector/portfolio.geojson \
  --source-crs EPSG:4326 \
  --name portfolio \
  --license CC0-1.0 \
  --output outputs/portfolio-report.json
# exit 2 expected (findings present)

pnpm gis export qgis \
  --input outputs/portfolio-report.json \
  --output outputs/qgis-rehearsal

# Second pass: local PostgreSQL 16 + PostGIS (apt; Docker still unavailable):
export GEOSPATIAL_POSTGIS_URL=postgres://explorer:explorer@127.0.0.1:5432/geospatial_quality_explorer
pnpm gis migrate
pnpm gis validate \
  --input packages/quality/fixtures/vector/portfolio.geojson \
  --source-crs EPSG:4326 \
  --name portfolio \
  --license CC0-1.0
pnpm gis export qgis \
  --run-id 72db8116767401f52458c300a446150afd607fe65fdf859e63840ba11360cfb3 \
  --output outputs/qgis-rehearsal-pg
```

Automated:

```sh
pnpm exec vitest run packages/quality/src/delivery.test.ts  # 3 passed
pnpm quality:full  # typecheck, lint, 40 tests, arch, knip, jscpd, ratchet — passed with PostGIS up
```

## Run identity

| Field | Value |
| --- | --- |
| runId | `72db8116767401f52458c300a446150afd607fe65fdf859e63840ba11360cfb3` |
| sourceHash | `ca19ec553e9620687135a149e842f424de01e1cb6458bff736cf5e72461b2d8b` |
| CRS | `EPSG:4326` |
| ruleset | `vector-core@1.0.0` |
| findings | 5 errors (empty geometry, duplicate id ×2, invalid ring, unsupported Point) |
| persistence | Report-file path proven; same run id also saved and re-exported via PostGIS |

## Bundle file list (`outputs/qgis-rehearsal/`)

| File | Present | Notes |
| --- | --- | --- |
| `findings.geojson` | yes | 5 features; fields include `severity`, `ruleId` |
| `findings.qgs` | yes | relative datasource `./findings.geojson`; no `.py` |
| `findings.qml` | yes | categorized renderer on `severity` (`error` / `warning` / `info`) |
| `run-metadata.json` | yes | full quality report (hash, CRS under `dataset.sourceCrs`, limitations, license) |

## XML / OGR checks

- Project XML contains `./findings.geojson`, layer fields `severity` and `ruleId`, project CRS `EPSG:4326`.
- Style XML uses `renderer-v2 type="categorizedSymbol" attr="severity"` with error/warning/info categories.
- `ogrinfo -al -so outputs/qgis-rehearsal/findings.geojson`: GeoJSON driver, 5 features, SRS EPSG:4326, attributes `findingId`, `ruleId`, `severity`, `featureId`, `explanation`, `suggestedAction`.
- Null geometries present for empty / unsupported findings (expected; OGR reports layer geometry type Polygon for the readable subset).

## What remains owner-visual / owner-owned

- Open `findings.qgs` in desktop QGIS 3 and confirm categorized severities visually.
- Browser finding detail (`pnpm dev:api` + `pnpm dev:web` + `?run=<id>`) — code exists on `main`; not re-proven in this agent session (focus remained QGIS-first per ADR 0004).

## Doc / code gaps (for MAC-53)

1. `docs/roadmap.md` still reads as pre-merge / “do not start until review”.
2. `docs/product-brief.md` still says FastAPI; stack is Node/TypeScript API.
3. `docs/weekly-guide.md` still points at foundation #9 / tracker #8.
4. `docs/demo.md` assumes PostGIS for the happy path and should also document `validate --output` + `export qgis --input <report.json>`.
5. No application-code defect found in the QGIS bundle path; delivery tests and `quality:full` green. No in-scope code fix required for this ticket.

## Verdict

MAC-52 acceptance for CLI + PostGIS persist + QGIS bundle + evidence: **met**.  
Desktop QGIS visual open and browser walkthrough: **owner-owned**, explicitly recorded.
