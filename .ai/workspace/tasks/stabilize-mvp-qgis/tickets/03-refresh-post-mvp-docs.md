# 03: Refresh product docs to post-MVP reality

## Parent and source

- Parent task: [stabilize-mvp-qgis](../index.md)
- Linear: [MAC-53](https://linear.app/maciker/issue/MAC-53) (parent [MAC-50](https://linear.app/maciker/issue/MAC-50); blocked by [MAC-52](https://linear.app/maciker/issue/MAC-52))
- Decision: [ADR 0004](../../../../../docs/adr/0004-post-mvp-stabilization.md)
- Depends on rehearsal notes from [02](02-prove-qgis-reviewer-path.md) / MAC-52

## What this slice delivers

Product-facing docs no longer describe a pre-merge tracker state or a FastAPI stack; they point a QGIS reviewer at the proven local path and the next allowed work boundary.

## Acceptance criteria

- [ ] [`docs/roadmap.md`](../../../../../docs/roadmap.md) states the MVP is on `main`, names stabilization / QGIS rehearsal as the current focus, and stops forbidding all work “until merge”.
- [ ] [`docs/product-brief.md`](../../../../../docs/product-brief.md) describes the Node/TypeScript API (not FastAPI) and keeps non-goals intact.
- [ ] [`docs/weekly-guide.md`](../../../../../docs/weekly-guide.md) points at this stabilization task (or equivalent) instead of “review foundation #9” as the active weekly focus.
- [ ] [`docs/qgis-review.md`](../../../../../docs/qgis-review.md) / [`docs/demo.md`](../../../../../docs/demo.md) / [`docs/limitations.md`](../../../../../docs/limitations.md) incorporate only gaps proven in ticket 02 (no speculative feature promises).
- [ ] No feature tickets outside `stabilize-mvp-qgis` are implied as authorized.

## Verification

- Human read-through of the touched docs against decision 0001 and ticket 02 evidence.
- Link check: demo and QGIS commands still match scripts in root `package.json`.

## Blocked by

- [02-prove-qgis-reviewer-path.md](02-prove-qgis-reviewer-path.md) — docs that describe the walkthrough must follow recorded rehearsal evidence, not assumptions.

## Scope and exclusions

- In scope: roadmap, product brief, weekly guide, and factual corrections to demo/QGIS/limitations driven by ticket 02.
- Out of scope: public GitHub visibility changes, portfolio site copy (MAC-30), new ADRs for future rules, publishing Linear issues.

## Status and evidence

blocked — waiting on ticket 02 evidence before editing walkthrough-dependent text. Factual “MVP merged / not FastAPI” edits may be prepared as a draft in the same PR once 02 starts, but must not be marked verified until 02 evidence exists.
