# Plan: stabilize-mvp-qgis

## Objective

Prove the merged MVP for a QGIS reviewer, keep the five-minute local demo runnable, and retire stale “pre-merge” documentation.

## Inputs

- [ADR 0004](../../../../docs/adr/0004-post-mvp-stabilization.md)
- [`docs/demo.md`](../../../../docs/demo.md), [`docs/qgis-review.md`](../../../../docs/qgis-review.md), [`docs/limitations.md`](../../../../docs/limitations.md)
- Open PR #16 (`cursor/fix-dev-api-pg-runtime-c146`)
- `main` at merge of PR #15

## Affected artifacts

- Runtime: root `package.json` `dev:api` script (via PR #16 or equivalent)
- Docs: `docs/roadmap.md`, `docs/product-brief.md`, `docs/weekly-guide.md`, and any demo/QGIS gaps found in ticket 02
- Evidence: this task’s `findings.md` / `validation.md` after rehearsal

## Strategy

Three independently verifiable vertical slices. Tickets 01 and 02 are ready and independent. Ticket 03 waits for rehearsal evidence so docs do not invent a QGIS walkthrough that was not run. No new validation rules, formats, or products in this task.

## Steps

- [x] Execute [01](tickets/01-land-dev-api-runtime-fix.md) — verification: `pnpm dev:api` serves `GET /health` → 200 (on `main` via MAC-51 / `826dfbf`)
- [x] Execute [02](tickets/02-prove-qgis-reviewer-path.md) — verification: export bundle matches `docs/qgis-review.md`; evidence in `findings.md` (PostGIS + desktop QGIS owner-owned)
- [x] Execute [03](tickets/03-refresh-post-mvp-docs.md) — verification: roadmap/brief/guide no longer claim pre-merge or FastAPI; QGIS path documented accurately
- [x] Write `validation.md` and `summary.md` for this task workspace

## Automated verification

- `pnpm quality:fast` (and `pnpm quality:full` before considering the task closed) on any code change from ticket 01
- Existing delivery tests for the QGIS bundle remain green

## Manual verification

- Desktop QGIS 3 opens `findings.qgs` and shows categorized severities (owner or reviewer machine; agents record XML/OGR checks when QGIS desktop is unavailable and mark the visual check as owner-owned)
- Full [`docs/demo.md`](../../../../docs/demo.md) path after ticket 01 lands

## Stop conditions

- Stop if export files disagree with `docs/qgis-review.md` in a way that needs product code changes — open a diagnosis artifact; do not silently expand scope into new rules.
- Stop if PostGIS or Docker is unavailable for a claimed “full” rehearsal — record the limitation and still verify the in-memory/CLI portions that can run.
- Do not publish Linear/GitHub tracker tickets unless the owner authorizes it.

## Plan mismatch protocol

If implementation reveals that the plan does not match reality:

1. Stop.
2. Document expected vs found in `findings.md`.
3. Explain why it matters.
4. Propose options.
5. Ask for approval before continuing.
