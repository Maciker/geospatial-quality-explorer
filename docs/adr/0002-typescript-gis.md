# ADR 0002: TypeScript GIS implementation

Accepted direction from the owner, 2026-09-22.

Use the pinned agent-workflow-code-ts workflow and TypeScript for all application, API and CLI logic. Preserve the existing small scaffold contracts while removing the Python runtime. Keep QGIS desktop and PostGIS SQL for GIS inspection/storage. JS/TS raster and model capabilities must be proven by adapter spikes; unsupported operations are blockers, not grounds for a silent Python fallback.

The cost is a smaller geospatial/ML library ecosystem. Mitigate through bounded fixtures, explicit capability tests, provenance and independent known-result checks. Vendor the workflow with attribution and a commit pin; upgrades require review. Roll back a rejected foundation through Git, without rewriting prior history.
