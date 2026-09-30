# Summary: stabilize-mvp-qgis

## What changed

- Recorded MAC-52 rehearsal evidence for portfolio → QGIS export (report-file and PostGIS `--run-id` paths).
- Refreshed product docs (MAC-53) so roadmap, brief, weekly guide, demo, QGIS review, and limitations match post-MVP TypeScript reality and the proven walkthrough.
- No application-logic change: MAC-51 was already on `main`; the QGIS bundle path needed no code fix. `pnpm quality:full` passed with PostGIS available.

## What remains

- Owner: open `findings.qgs` in QGIS Desktop; optional browser `?run=` walkthrough.
- Maintainer review / merge of the docs+evidence PR; then mark MAC-52 / MAC-53 / MAC-50 Done.
