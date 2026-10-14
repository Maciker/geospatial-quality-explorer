---
name: gis-data-integrity
description: Use when changing validation rules, geometry checks, CRS handling, fixtures, spatial storage or exports in this GIS repository.
---

# GIS Data Integrity

Spatial results must be reproducible, traceable and honest about their limits.

1. **CRS is declared, never inferred.** Require an explicit EPSG code. Reject a GeoJSON `crs` member and EPSG:4326 positions outside ±180/±90. Never reproject or relabel silently; omit geometries the output format cannot represent and record why in the run limitations.
2. **Source data is immutable.** Do not repair, snap, round or reorder input coordinates. Findings describe problems; fixes belong to a desktop GIS tool.
3. **Determinism over judgment.** Geometry, counts and validity come from versioned code, never from an LLM. Any change to what a rule reports for the same input bumps the ruleset and engine versions, updates `docs/limitations.md`, and adds known-geometry tests (valid and invalid) before production code.
4. **Validity is defined against OGC Simple Features.** When the planar engine knowingly differs (no tolerance, unsupported cases), state the gap in `docs/limitations.md` and point to `ST_IsValidDetail` or QGIS *Check validity* for an authoritative answer.
5. **Provenance travels with every run:** source hash of the exact bytes, declared CRS, license, ruleset id and version, parameters and limitations. Keep that metadata in API responses, reports and QGIS exports.
6. **Bounded inputs.** Respect `DATASET_LIMITS`; reject archives, remote URLs and oversize payloads explicitly with a stable error code.
7. **Licensed data only.** Commit only tiny synthetic or openly licensed fixtures with a license note and reviewed expected findings. Real datasets and generated outputs stay local and ignored.
8. **NoData and units.** For raster or measured values, preserve NoData and units explicitly; never treat NoData as zero or mix units without a recorded conversion.

Verify with `pnpm quality:full` and, for storage or export changes, the PostGIS integration tests and `pnpm test:e2e`.
