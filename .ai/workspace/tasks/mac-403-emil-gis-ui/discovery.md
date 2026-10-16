# Discovery: MAC-403 Emil GIS UI

## Problem

After MAC-402 the map/source/explain path works, but the Alexa panel still reads as chat + expanding cards with the map ~1kpx below the fold. Page scroll fights the chat scroller, and Explain replies are easy to miss off-screen.

## Success

- Map is the primary surface in the first viewport once the GIS pane is active.
- Findings list is compact; selected finding has a clear detail region with copyable full IDs.
- Assistant remains usable; new Explain (and other) replies scroll into view when the user was already at the bottom.
- Card/list scroll is contained per panel.
- Craft pass via `emil-design-eng` + `frontend-patterns`; stress with `break-ui` cases.
- Existing validate → list → select → explain → export E2E stays green.
- Due 2026-10-21.

## Restrictions

- No new validation rules, PostGIS, remote basemap tiles, or framework change.
- Keep simulation / live-mock badges and provenance visible.
- CSS Modules only; do not add a UI library.
- TDD for assertable behavior (chat stick-to-bottom helper, E2E viewport).

## Out of scope

- Rebranding / marketing landing.
- Open-ended prototype exploration (`ui-prototype`).
- MAC-232 video packaging beyond making the UI demo-ready.
