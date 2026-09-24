# 0004: Post-MVP next step is local stabilization for a QGIS reviewer

Status: accepted

## Context and constraints

- Tracker MVP (Linear MAC-32 / GitHub #8) and its vertical slices are Done.
- Implementation landed on `main` via PR #15.
- Open PR #16 fixes `pnpm dev:api` (`pg` resolution when running compiled `dist/`).
- `docs/roadmap.md` still says “review before merge”; `docs/product-brief.md` still mentions FastAPI.
- Product constraints remain: TypeScript-only app code, deterministic spatial results, local demo, preserve CRS/provenance, no hosted service.

## Decision

Grill answers (2026-09-24):

1. Next product objective: **stabilize** (demo + docs + PR #16), not new GIS rules or another product.
2. Primary user of the next slices: **QGIS desktop reviewer**.
3. Planning “done” means durable artifacts and vertical tickets before new product features.
4. Stale product docs are updated in the same batch, after rehearsal evidence where the text depends on a live walkthrough.

Execution map: `.ai/workspace/tasks/stabilize-mvp-qgis/`. Do not start feature work outside those tickets. Do not publish new Linear/GitHub issues unless the owner authorizes tracker writes.

## Alternatives and trade-offs

| Alternative | Trade-off |
| --- | --- |
| Expand `vector-core` | Useful later; risks unfinished demo evidence while the MVP is unproven on a reviewer machine. |
| Public release / portfolio visibility | Owner-gated (`docs/public-release.md`); blocked by a proven local demo. |
| Switch primary product to another GIS repo | Roadmap still names Quality Explorer as the primary GIS implementation. |

## Consequences and reversal cost

- Immediate work is rehearsal, runtime fix, and documentation alignment — low irreversible cost.
- QGIS-first means CLI validate → export → open-in-QGIS is the acceptance spine; browser/API are supporting.
- After these tickets are verified, a new grill / discovery cycle is required before post-MVP feature tickets.

## Evidence and related decisions

- Task workspace: `.ai/workspace/tasks/stabilize-mvp-qgis/`
- Related: `docs/demo.md`, `docs/qgis-review.md`, `docs/limitations.md`, ADR 0003
