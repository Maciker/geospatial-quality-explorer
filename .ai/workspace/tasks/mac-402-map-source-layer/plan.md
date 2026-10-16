# Plan: MAC-402 map source layer

## Approval

Status: approved
Approved by: Iker (via chat: "Pick the next issue, plan and Implement")
Approved at: 2026-10-15

## Objective

Wire a navigable geographic demo on Vercel alexa-only: serve catalog source layers to the browser (not the LLM), render source + findings on a persistent MapLibre map with local context and bidirectional selection, explain the selected finding by explicit findingId, and prove the NE demo-errors path with E2E.

## Recommended decisions

| # | Question | Decision |
| --- | --- | --- |
| 1 | Source delivery | `GET /api/v1/alexa-sim/fixtures/:fixtureId/source` returning FeatureCollection + license/CRS/provenance from sidecar; allowlisted fixture ids only; never an LLM tool. |
| 2 | Vercel routing | Preserve path via rewrite query `?path=` (or equivalent) so GET is not collapsed to health. |
| 3 | Chat provenance | Extend chat response with `datasetName` + `sourceHash` when a validation run is active. |
| 4 | Basemap context | Use the source polygons themselves as the geographic context (fill + labels from NAME); solid ocean background; no remote tiles. Optional light border outline. |
| 5 | Feature identity | MapLibre finding Feature.id = findingId; source Feature.id = business id/index. |
| 6 | Invalid geometry | Keep finding outline layers (line) always; fill may fail for bowties — line + highlighted stroke is the “safe” localization; tag `displayRole: finding-overlay`. |
| 7 | Explain selected | Panel button sends user message `Explain finding <findingId>.` and teach mock + orchestration to force explain_finding with that id. |
| 8 | Primary E2E dataset | `ne-admin0-westeurope-demo-errors` after validate+list. |

## Strategy

```text
Slice A  GET fixture source contract + Vercel/local routing + chat sourceHash/datasetName
Slice B  FindingsMap: persistent map, source+findings, selection, fit, legend
Slice C  AlexaSimPanel wiring + explain selected + no-geometry cards
Slice D  E2E NE path + visual screenshot artifact
```

## Steps

### Slice A — Source contract

- [ ] RED/GREEN: HTTP GET unknown fixture → 404; known fixture → FC + metadata; rate-limited.
- [ ] Fix `api/alexa-sim.ts` + `vercel.json` path preservation.
- [ ] Chat response includes `datasetName`/`sourceHash` from validate output.
- [ ] Browser client `fetchFixtureSource(fixtureId)`.

### Slice B — Map

- [ ] RED: unit tests for finding feature id = findingId; selection does not remount (test helpers / pure builders first).
- [ ] GREEN: FindingsMap props: `sourceCollection`, `findings`, `selectedFindingId`, `onSelect`, `fitToken`; create map once; setData on updates; fit only when fitToken changes.
- [ ] Legend + fit control + provenance caption props.

### Slice C — Panel

- [ ] On validate (datasetName present): fetch source layer; clear on clean session / run change.
- [ ] Cards show “sin geometría” when geometry null.
- [ ] Explain selected button; mock + orchestration parse findingId.
- [ ] List click selects + bumps fitToken for that finding.

### Slice D — E2E

- [ ] Playwright: validate NE demo-errors → list → select card → explain selected → export; screenshot map.

## Automated verification

`pnpm quality:full`, package tests, `pnpm test:e2e` (or targeted alexa e2e).

## Stop conditions

MapLibre cannot localize invalid PRT even with line layer — document limitation and keep auxiliary outline approach.
