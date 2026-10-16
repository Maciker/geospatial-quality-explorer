# Plan: MAC-441 vector basemap

## Goal

Show an open-source **vector** basemap under the source and finding layers, without losing the selection highlight, provenance labels, or the plain-background fallback.

## Approval

Approved by: Iker (via chat: "Implementa", after "El mapa tiene que ser vectorial") on 2026-10-16.

## Decision

OpenFreeMap **Positron** vector style (`https://tiles.openfreemap.org/styles/positron`): vector tiles from OpenStreetMap data in the OpenMapTiles schema, no API key, no registration, light and neutral so the finding colours stay readable. Its public homepage states the public instance is free with no request limits and no keys; the full terms page could not be read from this sandbox (network egress to tile hosts is blocked), so the human reviewer should confirm the terms before the final demo. The service is third party and may change, hence the fallback below.

Rejected: self-hosted PMTiles (needs a regional extract that cannot be fetched here, plus the pmtiles protocol), raster OSM tiles (not a vector map; usage policy), MapLibre demo tiles (demo only).

## Approach

| Before | After | Why |
| --- | --- | --- |
| Plain `#c5d4e0` background, `sources: {}` | After the map loads, fetch the style JSON (6 s timeout), prefix its source/layer ids with `basemap-`, add them **below** `source-fill`, set glyphs and sprite | Overlays and their click handlers stay untouched; no `setStyle` re-init |
| No attribution | Vector sources carry an explicit attribution (OpenStreetMap contributors, OpenMapTiles, OpenFreeMap) | ODbL / OpenMapTiles attribution on the map itself |
| n/a | `VITE_BASEMAP_STYLE_URL` selects the style; empty or `off` disables it | E2E and offline builds stay deterministic |
| n/a | Any fetch/parse/add failure leaves the plain background; container gets `data-basemap="on"` or `"off"` | Graceful degradation, observable in tests |

## Review follow-ups (same task)

- Glyphs and sprite are set before the layers (MapLibre validates text/icon layers against them); each layer is checked to exist after `addLayer` because MapLibre reports invalid layers as error events, not exceptions; a failure rolls everything back, including glyphs and sprite.
- The `data-drawn-findings` hook is only compiled in when `VITE_MAP_TEST_HOOKS=1` (set by the E2E build, never in production).
- Also fixed on this branch: zero-net-area polygons (the PRT bowtie) were dropped by the GeoJSON tiler; the sources use `tolerance: 0`.

## Checklist

- [ ] TDD `basemap.ts`: `resolveBasemapStyleUrl`, `planBasemap` (prefixing, attribution, validation of untrusted JSON)
- [ ] FindingsMap: load basemap below the overlays, fallback, `data-basemap`
- [ ] E2E build points `VITE_BASEMAP_STYLE_URL` at a local URL; new spec stubs it with `page.route`, asserts the basemap and attribution appear, and that the plain fallback works when the stub is absent
- [ ] Docs: `docs/limitations.md`, README, `THIRD_PARTY_NOTICES.md`, `docs/architecture.md` if needed
- [ ] quality:ci + E2E (35 + new) with CI fonts + QA + PR

## Out of scope

Self-hosting tiles, geocoding, routing, offline tile packs, reprojection.

## Risks

- Third-party availability during the demo (mitigated by fallback; live check by the owner).
- The basemap must not change `fitBounds` or the layout thresholds.
