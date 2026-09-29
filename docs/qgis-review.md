# Review findings in QGIS

The export is a GeoJSON file, run metadata, a QGIS project, and a categorized style. There is no PyQGIS script and no second validator.

From a stored run (PostGIS):

```sh
pnpm gis export qgis --run-id <run-id> --output outputs/qgis
```

From a quality report file (no database):

```sh
pnpm gis export qgis --input outputs/portfolio-report.json --output outputs/qgis
```

Open `outputs/qgis/findings.qgs` in QGIS 3. The project points at `./findings.geojson`, so keep the files in the same folder. The layer fields include `severity` and `ruleId`. `findings.qml` categorizes `error`, `warning`, and `info`.

`run-metadata.json` is the quality report for that run: source hash, declared CRS (`dataset.sourceCrs`), ruleset, limitations, and license. If the declared CRS is not `EPSG:4326`, finding geometries are null: this project does not reproject, and it does not label those coordinates as WGS84.

## Rehearsal note (2026-09-29)

The portfolio fixture path was proven via the report-file export on a clean agent checkout without Docker. Bundle files matched this walkthrough under XML and GDAL `ogrinfo` checks. Opening `findings.qgs` in desktop QGIS remains the reviewer's visual check when QGIS 3 is available.
