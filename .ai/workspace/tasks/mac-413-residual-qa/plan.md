# Plan: MAC-413 residual QA (post #32)

## Approval

Status: approved
Approved by: Iker (via chat: “Hay que arreglarlos. Sacar una rama, planificar e implementar”)
Approved at: 2026-10-17

## Objective

Close the four residual desktop GIS UI failures from Iker’s post-#32 re-QA: findings cards after validate, tighter initial fit (via findings-driven framing), no peninsula zoom on DEMO-EMPTY, and readable 64-char id wrapping.

## Inputs

- Linear [MAC-413](https://linear.app/maciker/issue/MAC-413) re-QA comment 2026-10-16 17:08
- `.ai/workspace/tasks/mac-413-residual-qa/research.md`

## Affected artifacts

- `packages/alexa-sim/src/application/ConversationalLoop.ts` — hydrate findings after successful validate
- `packages/alexa-tools` / adapter only if validate must return summaries (prefer loop-side list)
- `apps/web/src/findings/mapFeatures.ts` + `FindingsMap.tsx` — skip fit when selected has no overlay
- `apps/web/src/alexa/formatBreakableId.ts` — chunk long alphanumeric runs
- e2e `test/alexa-sim-map.e2e.ts` — assert cards after validate without a separate list turn

## Strategy

Independent slices, smallest first:

1. **No-geometry fit** — map helper: selected id without overlay → empty focus / no `fitBounds`.
2. **Breakable ids** — split long runs every 8 chars in addition to `:` / `-`.
3. **Findings after validate** — after successful `run_validation`, server calls `list_findings` (default page) and merges cards into the chat response so the rail fills without an extra user turn. Findings-first re-fit already exists → also tightens initial view (addresses wide Portugal).

## Steps

- [ ] TDD: `featuresForFit` / fit helper — selected without overlay does not return sibling overlays
- [ ] TDD: `splitBreakableId` chunks 64-char hex; separators still preferred
- [ ] TDD: ConversationalLoop (or extract helper) — validate reply includes finding cards
- [ ] Wire FindingsMap to skip `fitBounds` when focus empty under a selection
- [ ] Update e2e: cards visible after validate; keep list optional; DEMO-EMPTY does not require map zoom assert
- [ ] `pnpm quality:full` + QA + PR

## Automated verification

- Unit tests for mapFeatures, formatBreakableId, ConversationalLoop validate→cards
- Existing alexa-sim-map e2e green with cards-after-validate assertion
- `pnpm quality:full`

## Manual verification

Desktop Chromium on preview: validate NE demo-errors → 4 cards appear; map frames findings; DEMO-EMPTY click does not jump; Copy still Copied; long findingId wraps at chunk boundaries.

## Stop conditions

- Do not invent geometry for DEMO-EMPTY.
- Do not mutate source GeoJSON for display.
- Do not auto-explain or auto-export.
- Do not grow quality baselines.

## Plan mismatch protocol

If implementation reveals that the plan does not match reality:

1. Stop.
2. Document expected vs found.
3. Explain why it matters.
4. Propose options.
5. Ask for approval before continuing.
