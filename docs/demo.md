# Five-minute local demo

Use Node.js 22 or 24 and pnpm 10.17.1. The portfolio fixture is CC0 synthetic data in `packages/quality/fixtures/vector/portfolio.geojson`.

## Full path (PostGIS + browser)

```sh
corepack enable
pnpm install --frozen-lockfile
docker compose -f infra/docker-compose.yml up -d db
export GEOSPATIAL_POSTGIS_URL=postgres://explorer:explorer@127.0.0.1:5432/geospatial_quality_explorer
pnpm gis migrate
pnpm gis validate --input packages/quality/fixtures/vector/portfolio.geojson --source-crs EPSG:4326 --name portfolio --license CC0-1.0
pnpm dev:api
pnpm dev:web
```

The validate command prints `Run <64 hex characters>`. Open the Vite URL with `?run=<that id>`.

In the browser, read the dataset hash and ruleset, select a finding with the keyboard or the map, and filter severity to `warning` to see an empty match. Import `packages/quality/fixtures/vector/empty-geometry.geojson` from the form and open the new run. Cancel is available while a job is pending or running.

Export the same run for QGIS and for a reviewer:

```sh
pnpm gis export qgis --run-id <run-id> --output outputs/qgis
pnpm gis report --run-id <run-id> --output outputs/portfolio-report.json
```

## QGIS-only path (no database)

When PostGIS is unavailable, write the quality report during validate and export from that file:

```sh
pnpm gis validate --input packages/quality/fixtures/vector/portfolio.geojson --source-crs EPSG:4326 --name portfolio --license CC0-1.0 --output outputs/portfolio-report.json
pnpm gis export qgis --input outputs/portfolio-report.json --output outputs/qgis
```

Validate exits `2` when findings exist; the report and QGIS bundle are still written. This path does not persist the run or drive the browser.

Open `outputs/qgis/findings.qgs` in QGIS 3 as described in [qgis-review](qgis-review.md). Known limits are listed in [limitations](limitations.md). The checks are not a quality certificate.
