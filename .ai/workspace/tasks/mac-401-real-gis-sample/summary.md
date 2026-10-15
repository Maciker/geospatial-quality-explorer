# Summary: MAC-401

## Delivered

- Frozen Natural Earth 110m Admin 0 Western Europe sample + didactic error variant in the Alexa catalog.
- Per-dataset `*.fixture.json` sidecars; adapter no longer hardcodes CC0/EPSG:4326.
- Provenance zip, hashes, extract/verify scripts, Vitest digest locks.
- Docs/LICENSE/THIRD_PARTY honesty for Natural Earth vs synthetic CC0.
- Mock + session recovery recognize the new fixture ids.

## PR

https://github.com/Maciker/geospatial-quality-explorer/pull/29 — post-PR `APPROVED` at `c2abef19621bc84d925ae389af8a78eed44d6c08`.

## Follow-ups

- MAC-402 (map/layer wiring) unblocked by this data work.
- Optional: port clean extract to TypeScript / run pyshp extract in CI.
