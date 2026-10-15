# Task Research: MAC-401

## Task

**Linear:** [MAC-401](https://linear.app/maciker/issue/MAC-401) — *Añadir una muestra GIS real con procedencia y una variante con errores controlados*

**Goal:** Replace synthetic portfolio (coords ~0..10) as the demo star with a recognizable Natural Earth Admin 0 1:110m sample centered on Iberia / Western Europe, frozen in-repo with provenance. Keep portfolio for regression. Deliver clean reference + didactic error variant, manifest, reproducible TS transform; no downloads during demo.

**Blocks:** MAC-402 → MAC-232 demo delivery.

## Relevant files

| Path | Why |
| --- | --- |
| `packages/quality/fixtures/vector/*.geojson` | Catalog discovery is basename of `*.geojson` only |
| `packages/quality/fixtures/expected/*.json` | Reviewed `{ ruleId, featureId }` pairs |
| `packages/quality/fixtures/LICENSE.md` | Declares **all** fixtures as synthetic CC0 |
| `packages/alexa-tools/.../listFixtureCatalog.ts` | Hardcodes `license: "CC0-1.0"`, `defaultSourceCrs: "EPSG:4326"` |
| `packages/alexa-tools/.../BoundedSessionQualityToolsAdapter.ts` | `runValidation` always passes CC0 / EPSG:4326 |
| `packages/alexa-tools/.../toolContracts.ts` | `FixtureSummary` lacks origin / transformation / scale / didactic note |
| `packages/alexa-sim/.../sessionRecovery.ts` | Hardcoded catalog token list of 7 synthetic ids |
| `packages/alexa-sim/.../DeterministicMockLlm.ts` | Demo path hardcodes `portfolio` |
| `vercel.json` | `includeFiles: packages/quality/fixtures/vector/**` |
| `.gitignore` | `data/raw/` ignored — cannot freeze original there |

## Current behavior

- Catalog maps every `*.geojson` to CC0 + EPSG:4326.
- Adapter validates with the same hardcoded declaration (`name = fixtureId`).
- Existing rules already cover invalid geometry, duplicate id, empty geometry.
- Feature business id = `Feature.id` or `properties.feature_id` only; NE country codes are not ids unless copied.
- LLM payloads strip geometry already.
- Vercel already bundles everything under `vector/**`.

## Facts

1. Hardcoded license/CRS is centralized in catalog + adapter.
2. `DATASET_LIMITS` already match acceptance caps (1 MiB / 500 features / 10k positions/ring).
3. No new rules needed for the three didactic defects.
4. `data/raw/` is gitignored; committed provenance must live under `packages/quality/fixtures/…`.
5. Any new `*.geojson` under `vector/` is auto-listed; intermediate files must not use that extension there (or live outside `vector/`).

## Risks

- Mislabeling Natural Earth as CC0.
- Clean NE crop may yield `identifier.missing` unless ids are set from ADM0_A3.
- Session recovery allowlist drift for new fixture ids.
- Attributing injected errors to Natural Earth in UI/docs.

## Open questions (resolved in plan)

See plan recommended decisions.
