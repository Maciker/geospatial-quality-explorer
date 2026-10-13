# Validation CLI

Run commands from the repository root with Node 22 or 24.

```sh
pnpm gis migrate
pnpm gis validate --input packages/quality/fixtures/vector/clean.geojson --source-crs EPSG:4326 --name clean --license CC0-1.0
```

`GEOSPATIAL_POSTGIS_URL` or `--database` stores the run. Without a database the command still validates and can write files. The reference fixtures do not need a network.

## Arguments

| Command | Required | Optional |
| --- | --- | --- |
| `validate` | `--input`, `--source-crs`, `--name`, `--license` | `--output`, `--report`, `--database` |
| `migrate` | database URL | |
| `runs show` | `--run-id` and a database URL | |
| `export qgis` | `--run-id` or `--input`, and `--output` | `--database` |
| `report` | `--run-id` or `--input`, and `--output` | `--database` |

`--source-crs` is an EPSG code such as `EPSG:4326`. It is never inferred. A GeoJSON `crs` member is rejected.

Arguments are strict: an option a command does not support (for example a mistyped `--ouput`) or a stray word without `--` fails with exit code 1 instead of being ignored.

## Exit codes

| Code | Meaning |
| --- | --- |
| 0 | Validation finished with no findings |
| 2 | Validation finished and reported one or more findings |
| 1 | Invalid execution: missing file, malformed input, missing or unknown arguments, or database failure |

## Report

`--output` writes the machine-readable report: source hash, ruleset version, parameters, counts by severity, limitations, license reference, retention statement, and findings. `--report` writes the concise text form. The source file is not modified.
