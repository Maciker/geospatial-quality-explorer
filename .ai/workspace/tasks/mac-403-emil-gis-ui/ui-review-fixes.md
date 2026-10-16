# MAC-403 UI review fixes

Approved by: Iker (chat, 2026-10-16: "Prepara los arreglos en la rama"), scope = the five corrections of the UI review of PR #31.

## Fixed
- Narrow, short and zoomed windows (stacked layout, landscape phones, 200% zoom) no longer collapse the map to a few pixels or overlap the panels: the page scrolls and the map canvas keeps a minimum size (`--map-min-height`).
- The shell is a flex column, so the Alexa panel fills exactly the space below the nav; the composer is no longer cut off at the bottom of a 1440x900 window in the full app. The hosted `alexa-only` build has no nav and was not affected by this one.
- The message input no longer overlaps the Voice button (`box-sizing: border-box`, `minmax(0, 1fr)`).
- The keyboard focus ring of a finding card is no longer clipped by the scrolling list.
- Long unbroken feature ids (URNs) no longer push "Copy findingId" and the findingId line out of the rail.
- Regression coverage: `test/alexa-sim-layout.e2e.ts` (desktop, stacked and short viewports, long ids, focus ring).

## Second round (independent review of the fixes)
- The layout spec no longer calls the rate-limited fixture endpoint (it serves the real file from a route stub); the first version made CI fail when workers ran in parallel.
- The list and detail panels are bounded in the whole unlocked band, so 20 findings no longer stretch the map to 1700px.
- Run review keeps its 420px map (`.mapStandalone` sets a height again).
- The page unlocks (scrolls) below 600px high, below 900px wide, and in windows up to 1100px wide and 700px high (typical of a zoomed browser). Wide windows between 601 and 760px high keep the viewport-locked layout but compact the header (title and lead share a row) and the chat/detail shares, so the composer stays on screen and the list keeps 1-3 cards. A unit test keeps the two copies of the unlock media query identical.
- Run review: the map wrapper no longer stretches to the height of the findings list (`.mapShellStandalone`).
- The layout spec is checked with the CI fonts (Inter hidden, DejaVu Sans fallback), because the sizes depend on font metrics and the first two attempts passed locally and failed in CI.

## Not done (P3 notes of the review)
Live announcement of chat replies, "Copied" feedback, error-banner layout shift, reasons for disabled controls beyond `title`, list count / scroll affordance, descendant selectors and hardcoded colours versus `frontend-patterns`, mixed language ("sin geometría"), map camera animation on selection.
