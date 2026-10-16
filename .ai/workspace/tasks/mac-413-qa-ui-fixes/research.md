# Research: MAC-413 QA UI fixes

## Context

Production QA 2026-10-16 on Vercel after #30/#31. Fixture `ne-admin0-westeurope-demo-errors`. Six desktop bugs.

## Findings

| Bug | Evidence | Root cause |
| --- | --- | --- |
| Selection not distinct | `FindingsMap.tsx` fill opacity 0.75 vs 0.45; nearly identical line colors | Selection paint too subtle; all errors share red fill |
| Explain overzoom | `selectFinding` bumps `fitNonce`; `featuresForFit` returns only selected; `maxZoom: 8` | Tiny PRT bowtie (~2°) fills the view |
| No Copied feedback | `clipboard.writeText` only; label never changes | Never implemented |
| Poor layer fit | FRA Guiana + NOR Svalbard (+ISL) stretch source bbox | `featuresForFit` uses full MultiPolygon extents |
| Mixed language | `" · sin geometría"` hardcoded; e2e asserts Spanish | Leftover Spanish string |
| Mid-char wrap | `overflow-wrap: anywhere` on detail/chat | Breaks mid-token |

## Coverage gaps

No unit tests for selection paint or fit padding. Map e2e locks Spanish. No copied-state test.
