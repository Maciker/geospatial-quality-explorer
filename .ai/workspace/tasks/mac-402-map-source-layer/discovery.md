# Discovery: MAC-402 map source layer

## Problem

Hosted Alexa demo cannot show the real GIS sample as a source layer, has no local basemap context, incomplete map↔list selection, and explain depends on “next” rather than the visible selection.

## Success

Choose NE dataset → see source layer + local context → validate → select finding on map/list → explain that findingId → export same run. Works on Vercel alexa-only without PostGIS or tile APIs.

## Out of scope

New rules, auto-fix, PostGIS layer, full desktop GIS, MAC-403 Emil polish (coordinate only).
