# Task Workspace: stabilize-mvp-qgis

## Goal

Stabilize the merged GIS MVP so a QGIS reviewer can validate the CC0 portfolio fixture, export findings, and open them in desktop QGIS; land the `dev:api` runtime fix; and align product docs with post-merge reality.

## Artifacts

- [x] [ADR 0004](../../../../docs/adr/0004-post-mvp-stabilization.md) / [decision 0001](../../domain/0001-post-mvp-stabilization.md)
- [x] [plan.md](plan.md)
- [ ] progress.md
- [ ] findings.md
- [ ] validation.md
- [ ] summary.md
- [ ] review.md

## Tickets

| ID | Outcome | Status | Blocked by |
| --- | --- | --- | --- |
| [01](tickets/01-land-dev-api-runtime-fix.md) | `pnpm dev:api` starts for the full local demo | ready | none |
| [02](tickets/02-prove-qgis-reviewer-path.md) | QGIS reviewer path proven on the portfolio fixture | ready | none |
| [03](tickets/03-refresh-post-mvp-docs.md) | Roadmap and product docs match post-MVP truth | blocked | 02 |

## Current status

Planning complete after grill. Awaiting human approval to execute tickets (start with 01 and 02 in parallel).

## Next step

Approve execution of tickets 01 and 02. Do not open new GIS feature tickets until 03 is verified.
