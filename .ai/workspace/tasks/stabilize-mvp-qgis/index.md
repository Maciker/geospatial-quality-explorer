# Task Workspace: stabilize-mvp-qgis

## Goal

Stabilize the merged GIS MVP so a QGIS reviewer can validate the CC0 portfolio fixture, export findings, and open them in desktop QGIS; land the `dev:api` runtime fix; and align product docs with post-merge reality.

## Artifacts

- [x] [ADR 0004](../../../../docs/adr/0004-post-mvp-stabilization.md) / [decision 0001](../../domain/0001-post-mvp-stabilization.md)
- [x] [plan.md](plan.md)
- [x] [findings.md](findings.md) — MAC-52 rehearsal evidence (2026-09-29)
- [x] [validation.md](validation.md)
- [x] [summary.md](summary.md)
- [ ] review.md
- [ ] progress.md

## Tickets

| ID | Linear | Outcome | Status | Blocked by |
| --- | --- | --- | --- | --- |
| [01](tickets/01-land-dev-api-runtime-fix.md) | [MAC-51](https://linear.app/maciker/issue/MAC-51) | `pnpm dev:api` starts for the full local demo | done on `main` | none |
| [02](tickets/02-prove-qgis-reviewer-path.md) | [MAC-52](https://linear.app/maciker/issue/MAC-52) | QGIS reviewer path proven on the portfolio fixture | evidence recorded | none |
| [03](tickets/03-refresh-post-mvp-docs.md) | [MAC-53](https://linear.app/maciker/issue/MAC-53) | Roadmap and product docs match post-MVP truth | ready for review | 02 evidence available |

Parent roadmap: [MAC-50](https://linear.app/maciker/issue/MAC-50)

## Current status

MAC-51 landed on `main`. MAC-52 CLI/report-file QGIS path rehearsed; PostGIS and desktop QGIS marked owner-owned. MAC-53 docs updated from that evidence.

## Next step

Maintainer review of the docs/evidence PR; owner visual open of `findings.qgs` when QGIS Desktop is available; optional PostGIS + browser re-proof on a Docker host.
