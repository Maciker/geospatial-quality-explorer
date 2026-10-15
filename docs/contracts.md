# Vector contracts

Serialized datasets are GeoJSON FeatureCollections (RFC 7946). Callers pass source CRS separately as `EPSG:` plus four to six digits. A `crs` member on the collection or a feature is rejected.

## Finding

| Field | Required | Notes |
| --- | --- | --- |
| ruleId | yes | `geometry.empty`, `identifier.missing`, `identifier.duplicate`, `geometry.invalid`, `geometry.unsupported` |
| severity | yes | `error`, `warning`, or `info` |
| featureId | yes | Source id, or `index:<n>` when the id is missing |
| explanation | yes | Stable English sentence |
| suggestedAction | yes | Stable English sentence. Source data is not modified |
| geometry | no | Polygon or MultiPolygon in EPSG:4326, otherwise null |

Finding order is feature index, then rule id, then finding id.

## Limits

| Limit | Value |
| --- | --- |
| File size | 1,048,576 bytes |
| Features | 500 |
| Positions in one ring | 10,000 |
| Findings page size | 1 to 100, default 50 |

Positions are longitude and latitude pairs. Three-dimensional coordinates are rejected. Supported geometries are Polygon and MultiPolygon. Other geometry types produce `geometry.unsupported` and are not repaired.

## Fixtures

Reviewed fixtures live in `packages/quality/fixtures/vector/` (synthetic CC0 samples and Natural Earth Western Europe samples). Expected rule and feature ids live in `packages/quality/fixtures/expected/`. Licenses are per dataset; see `packages/quality/fixtures/LICENSE.md`.

`packages/quality/fixtures/vector/clean.geojson` is a single valid square. Its expected finding list is empty.
