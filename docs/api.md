# Local API

The API is a Node HTTP server. It binds to `127.0.0.1` by default and rejects a public bind. `/api` routes accept loopback clients only.

`GET /openapi.json` describes the routes. CORS allows `http://127.0.0.1:5173`, `http://localhost:5173`, `http://127.0.0.1:4173`, and `http://localhost:4173`.

## Routes

| Route | Purpose |
| --- | --- |
| `GET /health` | Service identity and UTC timestamp |
| `GET /api/v1/runs/{runId}` | Dataset, ruleset, source hash, CRS, license, limitations |
| `GET /api/v1/runs/{runId}/findings` | GeoJSON page |
| `POST /api/v1/imports` | Inline GeoJSON import |
| `GET /api/v1/jobs/{jobId}` | `pending`, `running`, `succeeded`, `failed`, or `cancelled` |
| `POST /api/v1/jobs/{jobId}/cancel` | Cancel before the run is stored |

Finding query parameters are `severity`, `ruleId`, `bbox`, `limit`, and `cursor`. Malformed values, including injection-like rule ids, return 400. An unknown run returns 404. Limits are 1 to 100. `bbox` is `minLon,minLat,maxLon,maxLat` and uses envelope overlap. Findings without geometry stay in an unfiltered list and drop out of a bbox query.

Imports accept only the keys `datasetName`, `sourceCrs`, `license`, and `geojson`. URLs, file paths, and zip archives are rejected. Bodies larger than 1,048,576 bytes return 413.
