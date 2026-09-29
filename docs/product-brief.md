# Product brief

## Problem

Geospatial teams often discover invalid geometries, inconsistent identifiers, missing CRS metadata, and project-specific quality defects too late. The result is manual cleanup, weak auditability, and unreliable downstream analysis.

## Product

Geospatial Quality Explorer is a local-first, open-source workflow that runs deterministic checks on vector datasets and makes each finding inspectable through a CLI, QGIS, PostGIS, and a browser.

## First release

- Validate a small GeoJSON dataset against documented rules.
- Produce a structured report and persist its run/finding history locally.
- Serve findings as bounded GeoJSON through a Node/TypeScript loopback API.
- Inspect results in QGIS and a MapLibre browser view.

## Non-goals for the first release

- Hosted multi-tenant service, authentication, billing, or uploads.
- Automatic data repair or automatic CRS inference.
- AI-generated validity decisions. AI may later explain a verified finding only.

## Evidence of success

A reviewer can clone the repository, run a reference dataset, inspect a finding in QGIS and the browser, and understand the limits of the checks in under five minutes.
