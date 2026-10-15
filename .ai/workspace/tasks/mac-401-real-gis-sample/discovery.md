# Discovery: MAC-401 real GIS sample

## Problem

The hosted Alexa demo stars the synthetic `portfolio` fixture (unit-square coords). Reviewers cannot recognize geography. Catalog and adapter force `CC0-1.0` / `EPSG:4326` on every fixture, which cannot honestly describe Natural Earth.

## Restrictions

- No new validation rules, no general reprojection, no arbitrary upload, no auto-repair.
- No downloads at demo/runtime; freeze bytes in git.
- Do not relabel Natural Earth as CC0.
- Do not send full geometries to the LLM (already true).
- Keep portfolio for regression.
- TypeScript / pnpm; TDD; quality gates.

## Success criteria

- Two choosable catalog datasets: clean Western Europe NE sample + didactic error variant.
- Provenance recorded (URL, date, version, hashes, transform steps).
- Per-dataset license/CRS/metadata in catalog, validation declaration, selector/summary surfaces, and export parameters.
- Expected findings measured with core and frozen.
- Both datasets work list → validate → explain → export on Vercel bundle path.
- Explicit didactic disclaimer; cartographic-scale honesty.

## Out of scope

MAC-402 map wiring, MAC-403 UI polish, Devpost video/README package (MAC-232).
