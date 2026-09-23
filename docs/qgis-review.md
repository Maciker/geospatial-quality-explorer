# Review findings in QGIS

The export is a GeoJSON file, run metadata, a QGIS project, and a categorized style. There is no PyQGIS script and no second validator.

```sh
pnpm gis export qgis --run-id <run-id> --output outputs/qgis
```

Open `outputs/qgis/findings.qgs` in QGIS 3. The project points at `./findings.geojson`, so keep the files in the same folder. The layer fields include `severity` and `ruleId`. `findings.qml` categorizes `error`, `warning`, and `info`.

`run-metadata.json` repeats the source hash, declared CRS, ruleset, limitations, and license. If the declared CRS is not `EPSG:4326`, finding geometries are null: this project does not reproject, and it does not label those coordinates as WGS84.

This walkthrough was checked by reading the project XML and by opening the GeoJSON with GDAL's OGR reader when that tool is installed. A desktop QGIS session is still the reviewer's visual check.
