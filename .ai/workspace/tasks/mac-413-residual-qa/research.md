# Research: MAC-413 residual QA (post #32)

## Context

PR #32 merged the original six desktop fixes. Iker re-QA on 2026-10-16 19:05 (OpenFreeMap basemap) confirmed:

- Fixed: PRT highlight, Explain zoom, Copy feedback, mixed language.
- Still open (this task):

| Severity | Bug | Observed |
| --- | --- | --- |
| Media | Empty findings rail after validate | «No findings yet» while run has 4 findings until «List findings» |
| Low | Initial map too wide | Portugal looks small after validate |
| Low | DEMO-EMPTY selection zooms | No-geometry card still fits Iberia |
| Low | Mid-token id wrap | 64-char hex still breaks mid-hash |

## Root causes

1. **Empty cards after validate** — `run_validation` returns only `{ runId, datasetName, sourceHash, findingCount, … }`. `extractStructuredState` keeps `findings: existing` for that shape (`ConversationalLoop.ts`). Cards fill only on `list_findings` / `explain_finding`. Empty copy in `AlexaSimPanel` tells the user to list findings.

2. **Wide initial fit** — After validate, source GeoJSON loads and `fitNonce` bumps with `featuresForFit` using mainland-clipped source (still W Europe envelope) at `maxZoom: 5`. Findings-driven re-fit (`AlexaSimPanel` lines 198–200) never runs until cards appear.

3. **DEMO-EMPTY zoom** — `selectFinding` always increments `fitNonce`. `featuresForFit`: when selected id has no overlay, it falls through to **all** finding overlays → Iberia fit.

4. **64-char wrap** — `splitBreakableId` only splits after `:` / `-`. The hash segment has neither; `overflow-wrap: break-word` still breaks mid-hex.

## Existing tests that lock behavior

- ConversationalLoop validate-then-list flow expects findings only after list.
- `mapFeatures` / fit tests cover selected overlay + mainland clip; no “selected without geometry → do not refit”.
- `formatBreakableId` tests only `:` / `-` splits.
- e2e still requires explicit «List the findings.» before cards.

## Out of scope

Mobile QA, clipboard content QA, focus ring visibility, changing welcome copy beyond what the empty-state needs.
