# Limitations

- Ruleset `vector-core` 1.0.0 checks empty geometry, missing ids, duplicate ids, polygon ring validity, and unsupported geometry types. It does not certify positional accuracy, attributes, or topology between features.
- Only Polygon and MultiPolygon are spatially checked. Other types are reported as unsupported.
- Source CRS must be declared. Coordinates are copied into RFC 7946 geometries only for `EPSG:4326`.
- Inputs are bounded: 1,048,576 bytes, 500 features, and 10,000 positions in a ring.
- The browser map has no remote basemap. It draws stored finding geometries on a plain background.
- The API is an unauthenticated loopback Node/TypeScript service.
- QGIS project files are a portable starting point. Desktop styling and the visual open of `findings.qgs` remain the reviewer's check; agents without QGIS Desktop record XML/OGR evidence instead.
- Without PostGIS, `validate --output` plus `export qgis --input <report.json>` still produces the portable bundle, but the run is not persisted and the browser path is unavailable.
