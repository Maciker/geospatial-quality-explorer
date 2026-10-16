# Plan: MAC-413 QA UI fixes

## Goal

Fix the six desktop GIS UI failures from production QA so selection, Explain framing, copy feedback, layer fit, English copy, and long-id wrapping behave correctly on the Vercel demo.

## Approval

Approved by: Iker (via chat: “Go”) on 2026-10-16.

## Approach

| Before | After | Why |
| --- | --- | --- |
| Selected finding almost same red as others | Strong selected outline/fill; dim unselected overlays | PRT must be visually distinct |
| Select/Explain fits only selected at maxZoom 8 | Pad selected bounds (~2°) and cap maxZoom ~6 | Keep Iberia context |
| Source fit includes Guiana/Svalbard | Fit uses mainland-Europe polygon parts only (display data unchanged) | Europe framed without overseas stretch |
| Copy has no success UI | Ephemeral “Copied” + aria-live | Confirm clipboard action |
| “sin geometría” | “no geometry”; update e2e | English UI |
| `overflow-wrap: anywhere` | Break at separators (ZWSP) + `break-word` | Readable long ids |

## Checklist

- [ ] TDD: `featuresForFit` mainland filter + selected fit context helpers
- [ ] TDD: `formatBreakableId` inserts break opportunities at `:` / `-`
- [ ] FindingsMap: stronger selection paint; padded selected fit
- [ ] AlexaSimPanel: Copied feedback; English “no geometry”
- [ ] CSS: break-word for detail/chat; use breakable ids
- [ ] Update alexa-sim-map.e2e Spanish assertion
- [ ] quality:full + QA + PR

## Out of scope

Mobile QA, inventing geometry for DEMO-EMPTY, fixture coordinate edits, Devpost packaging.

## Risks

- Shared FindingsMap used by FindingsReview — selection paint must stay readable there.
- Mainland filter is fit-only; never mutate source GeoJSON for display.
