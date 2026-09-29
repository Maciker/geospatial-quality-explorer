# Validation: stabilize-mvp-qgis

## MAC-51

Already on `main` (`826dfbf`): `dev:api` uses `tsx apps/api/src/main.ts`. Not re-run in this session.

## MAC-52

| Criterion | Result |
| --- | --- |
| `pnpm gis validate` on portfolio produces run id | Pass — `72db8116…60cfb3` |
| Run stored | CLI report file only (`--output`); PostGIS unavailable (no Docker) — recorded |
| `export qgis` writes geojson/qgs/qml/metadata | Pass |
| Bundle matches `docs/qgis-review.md` | Pass — relative datasource, severity categories, CRS/limitations in metadata |
| Evidence in `findings.md` | Pass |
| Desktop QGIS visual | Owner-owned |
| `packages/quality` delivery tests | Pass (3/3) |

## MAC-53

| Criterion | Result |
| --- | --- |
| `docs/roadmap.md` post-MVP / stabilization focus | Updated |
| `docs/product-brief.md` Node/TypeScript API (not FastAPI) | Updated |
| `docs/weekly-guide.md` points at MAC-50 / stabilize task | Updated |
| demo / qgis-review / limitations from MAC-52 evidence only | Updated (report-file path + owner-visual note) |
| No unauthorized feature tickets implied | Pass |

## Commands

```sh
pnpm install --frozen-lockfile
pnpm gis validate --input packages/quality/fixtures/vector/portfolio.geojson --source-crs EPSG:4326 --name portfolio --license CC0-1.0 --output outputs/portfolio-report.json
pnpm gis export qgis --input outputs/portfolio-report.json --output outputs/qgis-rehearsal
pnpm exec vitest run packages/quality/src/delivery.test.ts
# then quality gates on the PR branch
```
