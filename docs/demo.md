# Five-minute local demo

Use Node.js 22 or 24 and pnpm 10.17.1. The portfolio fixture is CC0 synthetic data in `packages/quality/fixtures/vector/portfolio.geojson`.

## Fastest path: Alexa+ simulation (no database, no API key)

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm dev:api
pnpm dev:web
```

Open the Vite URL with `?sim=alexa`. The badges read *Simulation of Alexa+ — not an Amazon product* and *Model: deterministic mock*. Type or say, in order:

1. `Validate the portfolio fixture.` — the reply cites a 64-character run id.
2. `List the findings.` — finding cards appear with `findingId`, `ruleId` and `featureId`, and the map draws them.
3. `Explain the next finding.` — the explanation comes from the deterministic core, not the model.
4. `Export QGIS.` — download the bundle and open `findings.qgs` (see [qgis-review](qgis-review.md)).

The mock understands these phrasings only; the live model accepts free wording. Asking it to repair geometry is refused by design.

Set `NAN_API_KEY` before `pnpm dev:api` to use the live model instead; the badge then reads *Model: live LLM*.

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

In the browser, read the dataset hash and ruleset, select a finding with the keyboard or the map, and filter severity to `warning` to see an empty match (every `vector-core` rule reports severity `error`, so the filter demonstrates an empty result rather than a mixed list). Import `packages/quality/fixtures/vector/empty-geometry.geojson` from the form and open the new run. Cancel is available while a job is pending or running.

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
