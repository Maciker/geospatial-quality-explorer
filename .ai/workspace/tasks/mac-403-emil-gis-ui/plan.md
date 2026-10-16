# Plan: MAC-403 Emil GIS UI

## Goal

Ship a GIS-desktop Alexa simulation shell: map as primary surface, compact findings list, selected detail with copyable IDs, accessible assistant with Explain replies kept visible.

## Approval

Approved by: Iker (via chat: “Go”) on 2026-10-16.

## Approach

| Before | After | Why |
| --- | --- | --- |
| Map after unbounded finding cards (~1kpx down) | Map fills primary column; cards in a capped rail | GIS-desktop hierarchy; map must stay in first viewport |
| Cards show full explanation + findingId | Compact rows (rule, severity, feature, sin geometría); detail panel holds full IDs | Scan list without scrolling the page |
| Chat never auto-scrolls | Stick to bottom on new assistant message only if near bottom | Keep Explain visible without stealing focus when reading history |
| “Hold to speak” on click; TTS always on | “Click to speak”; TTS only when Voice on | Label matches behavior; voice can be silenced |
| Fixed 420px map | Map fills `.mapRegion` (min ~55vh) via CSS; FindingsReview keeps its own wrap | Primary surface without breaking review page |

## Checklist

- [ ] Extract `shouldStickChatToBottom(el)` (near-bottom threshold) — TDD
- [ ] Redesign `AlexaSimPanel` layout: chrome → workspace (map | findings rail + chat)
- [ ] Compact cards + detail panel (copy findingId / run context)
- [ ] Contained scrollers; scroll latest assistant into view when stick applies
- [ ] Button `:active`/`:focus-visible`, disabled titles, aria-live for busy/error
- [ ] Voice label + gate `speak()` on `voiceEnabled`
- [ ] FindingsMap CSS: height 100% when parent sized; panel mapRegion min-height
- [ ] E2E: after list, map canvas in viewport; after Explain, assistant bubble intersecting viewport
- [ ] Before/After/Why craft notes in task summary; quality gates + QA + PR

## Out of scope

Rebranding, new UI library, remote fonts/NAME labels, PostGIS, marketing landing.

## Risks

- Shared FindingsMap styles — size via parent, not a global fixed height change that shrinks FindingsReview oddly.
- E2E selectors must keep existing aria-labels where possible.
