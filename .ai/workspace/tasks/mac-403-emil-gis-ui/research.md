# Task Research: MAC-403

## Facts

- `AlexaSimPanel` DOM order: chat | toolbar → dataset → **unbounded cards** → detail snippet → **map last**.
- Only `.messages` has `overflow-y: auto`; `.cards` grows the page.
- FindingsMap canvas height is fixed at 420px (shared with FindingsReview).
- Explain appends to chat with no scroll management.
- Mic button label says "Hold to speak" but activates on click; TTS speaks on every success regardless of Voice off.
- MAC-402 follow-up explicitly deferred Emil UI polish and map-below-fold to MAC-403.

## Files

| Path | Role |
| --- | --- |
| `apps/web/src/alexa/AlexaSimPanel.tsx` | Layout, cards, scroll, voice |
| `apps/web/src/alexa/AlexaSimPanel.module.css` | Shell grid, density |
| `apps/web/src/findings/FindingsMap.module.css` | Map fill height via parent |
| `test/alexa-sim-map.e2e.ts` | Viewport + Explain visibility |
| `.ai/workspace/.gitignore` | Allowlist mac-403 task dir |

## Slice order

1. GIS-desktop shell (map primary, compact rail, chat accessible).
2. Scroll containment + stick-to-bottom for new assistant messages.
3. Emil density / button states / focus / reduced-motion.
4. Voice label + TTS gated by Voice on.
5. break-ui / E2E assertions.
