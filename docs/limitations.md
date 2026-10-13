# Limitations

- Ruleset `vector-core` 1.1.0 checks empty geometry, missing ids, duplicate ids, polygon validity, and unsupported geometry types. It does not certify positional accuracy, attributes, or topology between features.
- Polygon validity is planar and exact on the input numbers (no tolerance, no reprojection). It rejects open or short rings, zero-area rings, self-intersections including vertex touches and collinear spikes, holes outside or crossing the exterior, overlapping or nested holes, and overlapping MultiPolygon parts. It does not detect holes or parts that only share a collinear edge, and it does not report every OGC `ST_IsValidDetail` reason. For an authoritative check, run `ST_IsValidDetail` in PostGIS or QGIS *Check validity* on the exported findings.
- Only Polygon and MultiPolygon are spatially checked. Other types are reported as unsupported.
- Source CRS must be declared. Coordinates are copied into RFC 7946 geometries only for `EPSG:4326`, and a declared `EPSG:4326` dataset with a Polygon or MultiPolygon position outside longitude -180..180 or latitude -90..90 is rejected (`position.out_of_range`) because the declaration is almost certainly wrong. Other CRSs are not range-checked or reprojected.
- Inputs are bounded: 1,048,576 bytes, 500 features, and 10,000 positions in a ring.
- The browser map has no remote basemap. It draws stored finding geometries on a plain background.
- The API is an unauthenticated loopback Node/TypeScript service.
- QGIS project files are a portable starting point. Desktop styling and the visual open of `findings.qgs` remain the reviewer's check; agents without QGIS Desktop record XML/OGR evidence instead.
- Without PostGIS, `validate --output` plus `export qgis --input <report.json>` still produces the portable bundle, but the run is not persisted and the browser path is unavailable.
