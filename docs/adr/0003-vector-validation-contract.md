# ADR 0003: Vector validation contract

## Context

The MVP must validate small GeoJSON datasets without inferring a CRS, repairing coordinates, or using an LLM as a geometry oracle.

## Decision

- Ruleset `vector-core` `1.0.0` checks empty geometry, missing and duplicate feature ids, polygon validity, and unsupported geometry types.
- Spatial validity is delegated to `planar-polygon-engine` `1.0.0`, a pure adapter covered by known polygons.
- Finding geometries are copied only when the declared source CRS is `EPSG:4326`. Other EPSG codes are stored as metadata and their coordinates are not reprojected.
- The canonical finding payload is JSON. PostGIS geometry columns are an additional spatial representation, not the precision source of truth.
- Completed runs are immutable. A failed run id may be replaced by one later successful transaction.

## Alternatives

- Reproject with PROJ inside the validator. Rejected because a wrong declared CRS would silently move data.
- Call GEOS through a native binding for the first slice. Rejected for the bounded polygon rules; the engine name and version leave room for a later GEOS adapter behind the same port.

## Consequences

Non-WGS84 datasets remain checkable for structure and topology, but QGIS and the browser receive null geometries for those findings until an explicit transform exists.

## Amendment 2026-10-13

`vector-core` `1.1.0` and `planar-polygon-engine` `1.1.0` add rejection of non-proper self-intersections (vertex touches, collinear spikes), zero-area rings, holes sharing an edge with or touching the exterior more than once, overlapping, nested or edge-sharing holes, and overlapping or edge-sharing MultiPolygon parts. Run ids change because the ruleset version is part of the run material. Runs stored under `1.0.0` stay readable and are not rewritten.
