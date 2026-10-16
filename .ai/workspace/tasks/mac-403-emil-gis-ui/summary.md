# Summary: MAC-403

## Delivered

GIS-desktop Alexa simulation shell: map as primary surface, compact findings rail with detail + copyable findingId, contained scrollers, stick-to-bottom Explain visibility, voice label/TTS gating, Emil press/focus/reduced-motion polish.

## Before / After / Why

| Before | After | Why |
| --- | --- | --- |
| Map after unbounded finding cards (~1kpx down) | Map fills primary column in first viewport | GIS-desktop hierarchy for demo/video |
| Cards show full explanation + findingId | Compact rows; detail panel holds IDs + copy | Scan list without page scroll |
| Chat never auto-scrolls | Stick to bottom when near bottom | Keep Explain visible without stealing history focus |
| “Hold to speak” on click; TTS always | “Click to speak”; TTS only with Voice on | Label matches behavior; voice can mute |
| Fixed 420px map only | Map fills sized parent; review keeps min-height | Primary surface without breaking FindingsReview |

## Skills

- `emil-design-eng`, `frontend-patterns`, `break-ui` (compact list + long-id detail + empty state)

## Follow-ups

- Optional NAME labels with local glyphs
- Deeper break-ui fixture toggle if judges want a stress harness in-app
