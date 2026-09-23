# Glossary

| Term | Meaning |
| --- | --- |
| Dataset | A GeoJSON FeatureCollection plus an explicit declaration: name, source CRS, license, and parameters. |
| Source CRS | The coordinate reference system declared beside the file. It is never read from a GeoJSON `crs` member and never inferred. |
| Source hash | SHA-256 of the original file bytes. |
| Ruleset version | `vector-core` `1.0.0` for this MVP. |
| Run ID | SHA-256 of the source hash, ruleset, CRS, name, license, feature count, and parameters. |
| Finding | One rule result: rule id, severity, feature id, explanation, suggested action, and optional RFC 7946 geometry. |
| Feature ID | `Feature.id` when it is a string or finite number; otherwise `properties.feature_id`. A missing id is itself a finding and is referenced as `index:<n>`. |
| Severity | `error`, `warning`, or `info`. The current ruleset emits `error` only. |
| Geometry engine | `planar-polygon-engine` `1.0.0`. It reports polygon validity and does not change coordinates. |
| Limitation | A statement of what the run did not check. Findings are not a quality certificate. |

Rejected synonyms: "fix" for a finding, "guessed CRS", and "quality guarantee".
