# MAC-403 UI review fixes

Approved by: Iker (chat, 2026-10-16: "Prepara los arreglos en la rama"), scope = the five corrections of the UI review of PR #31.

## Fixed
- Narrow, short and zoomed windows (stacked layout, landscape phones, 200% zoom) no longer collapse the map to a few pixels or overlap the panels: the page scrolls and the map canvas keeps a minimum size (`--map-min-height`).
- The shell is a flex column, so the Alexa panel fills exactly the space below the nav; the composer is no longer cut off at the bottom of a 1440x900 window in the full app. The hosted `alexa-only` build has no nav and was not affected by this one.
- The message input no longer overlaps the Voice button (`box-sizing: border-box`, `minmax(0, 1fr)`).
- The keyboard focus ring of a finding card is no longer clipped by the scrolling list.
- Long unbroken feature ids (URNs) no longer push "Copy findingId" and the findingId line out of the rail.
- Regression coverage: `test/alexa-sim-layout.e2e.ts` (desktop, stacked and short viewports, long ids, focus ring).

## Not done (P3 notes of the review)
Live announcement of chat replies, "Copied" feedback, error-banner layout shift, reasons for disabled controls beyond `title`, list count / scroll affordance, descendant selectors and hardcoded colours versus `frontend-patterns`, mixed language ("sin geometría"), map camera animation on selection.
