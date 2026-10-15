# Plan: MAC-401 real GIS sample

## Approval

Status: approved
Approved by: Iker (via chat: "Coge el siguiente issue, planifica e implementa")
Approved at: 2026-10-15

The planner writes `Status: proposed` and leaves the approver empty. Only a human sets `Status: approved` with their name and date. The executor does not start while the status is not `approved`. Reference this plan from the PR description so the approval survives the local workspace.

## Objective

Freeze a small Natural Earth Admin 0 1:110m Western Europe / Iberia Polygon/MultiPolygon sample with honest provenance, plus a separate didactic error variant (invalid geometry, duplicate id, missing geometry). Stop hardcoding CC0/EPSG:4326 for every fixture; read per-dataset metadata. Keep synthetic portfolio for regression. Both new datasets must be choosable/validatable from the Alexa sim and included in the Vercel serverless bundle.

## Inputs

- Linear [MAC-401](https://linear.app/maciker/issue/MAC-401)
- `.ai/workspace/tasks/mac-401-real-gis-sample/research.md`
- `.ai/workspace/tasks/mac-401-real-gis-sample/discovery.md`
- Skills: `gis-data-integrity`, `architecture-hexagonal`, `xp-tdd-practices`, `testing-standards`

## Recommended decisions

| # | Question | Decision |
| --- | --- | --- |
| 1 | Fixture ids | `ne-admin0-westeurope` (clean) and `ne-admin0-westeurope-demo-errors` (didactic). |
| 2 | License string | `NaturalEarth-public-domain` (not `CC0-1.0`); document NE terms URL in LICENSE / provenance. Synthetic fixtures remain `CC0-1.0`. |
| 3 | Manifest shape | Per-fixture sidecar `*.fixture.json` beside each catalog GeoJSON under `vector/`. Synthetic fixtures also get sidecars so catalog never hardcodes. |
| 4 | Unmodified original | Tracked under `packages/quality/fixtures/provenance/natural-earth-110m-admin0/` (zip + SHA + provenance.md). Not a catalog entry. |
| 5 | Clean ids | Set deterministic `Feature.id` from `ADM0_A3`; keep `NAME`, `ADM0_A3`, `ISO_A3` properties. Measure baseline; do not claim zero findings without checking. |
| 6 | Country selection | Western Europe + Iberia ADM0_A3 allowlist (ESP, PRT, AND, FRA, GBR, IRL, BEL, NLD, LUX, DEU, CHE, AUT, ITA, MCO, LIE, DNK, NOR, SWE, ISL, MLT). No simplify unless needed for size. |
| 7 | Provenance in export | Put origin, version, transformation, scale, didactic note into validation `parameters` so they already travel in quality report / run metadata without schema churn. Extend `FixtureSummary` with optional display fields for selector/list_fixtures. |
| 8 | Demo star | Keep DeterministicMockLlm on `portfolio` for regression stability; update help/welcome copy to mention the NE samples as available. Session recovery allowlist derived from catalog (or extended tokens). |
| 9 | Transform | Checked-in TS script under `packages/quality/scripts/` that reads frozen zip/extract and writes derived GeoJSON + asserts hashes; runnable offline. |

## Affected artifacts

### Production

- `packages/quality/fixtures/provenance/**` — frozen NE download + provenance notes
- `packages/quality/fixtures/vector/ne-admin0-westeurope*.geojson` + sidecars
- `packages/quality/fixtures/vector/*.fixture.json` — metadata for all catalog fixtures
- `packages/quality/fixtures/expected/ne-admin0-*.json`
- `packages/quality/fixtures/LICENSE.md` — split synthetic CC0 vs Natural Earth PD
- `packages/quality/scripts/build-ne-admin0-fixtures.ts` — reproducible transform
- `packages/alexa-tools/.../toolContracts.ts` — extend `FixtureSummary`
- `packages/alexa-tools/.../listFixtureCatalog.ts` — read sidecars
- `packages/alexa-tools/.../BoundedSessionQualityToolsAdapter.ts` — declaration from metadata
- `packages/alexa-sim/.../sessionRecovery.ts` — catalog tokens include new ids
- `packages/alexa-sim/.../openAiToolDefinitions.ts` — stop saying “CC0 only”
- Docs: `docs/hackathon/tool-contracts.md`, `docs/demo.md` (brief), fixture LICENSE
- `vercel.json` — widen `includeFiles` if provenance must be readable at runtime (prefer not; only catalog geojson+sidecars needed at runtime)

### Tests

- New: `listFixtureCatalog.test.ts` (per-dataset license/CRS)
- Adapter tests: NE fixture validate uses NE license; export metadata carries parameters
- `validateDataset.test.ts`: expected findings for new fixtures; declaration license from sidecar for NE
- `sessionRecovery.test.ts`: new fixture tokens

### Out of scope

- MAC-402 map/layer wiring, MAC-403 Emil UI, video/Devpost (MAC-232), new rules, PostGIS.

## Strategy

```text
Slice A  Sidecar manifest schema + catalog/adapter read per-dataset license/CRS  [TDD]
Slice B  Freeze NE original + build clean + demo-errors fixtures + expected findings
Slice C  Wire recovery tokens + tool/docs copy + LICENSE honesty
Slice D  Quality gates + QA evidence
```

## Steps

### Slice A — Per-dataset metadata

- [ ] **RED:** Catalog tests: synthetic fixtures report `CC0-1.0`; missing sidecar fails loudly or is rejected from catalog. — `listFixtureCatalog.test.ts`
- [ ] **GREEN:** Read `*.fixture.json`; map into `FixtureSummary` (+ optional origin, scaleNote, didacticNote, transformation).
- [ ] **RED/GREEN:** Adapter `runValidation` uses sidecar license/CRS/name/parameters; assert NE license ≠ CC0 when NE fixtures present (or with temp dir fixtures first).
- [ ] Add sidecars for existing synthetic fixtures so nothing relies on hardcoded defaults.

### Slice B — Natural Earth freeze + variants

- [ ] Download official 110m Admin 0 countries zip into `fixtures/provenance/…`; record URL, date, etag/hash, terms link.
- [ ] TS script selects allowlisted countries, sets `Feature.id` from `ADM0_A3`, writes clean GeoJSON ≤1 MiB.
- [ ] Derived demo-errors: at least one localizable invalid polygon, one duplicate id, one null geometry; label in sidecar.
- [ ] Measure findings with core; write `fixtures/expected/*.json`; extend `validateDataset.test.ts` (use correct license per fixture).
- [ ] Document that injected errors are intentional, not from Natural Earth.

### Slice C — Sim + docs surfaces

- [ ] Session recovery catalog tokens include new fixture ids (prefer building from catalog list).
- [ ] Update tool-contracts, LICENSE.md, openAi tool description, brief demo docs.
- [ ] Confirm `vercel.json` includeFiles covers geojson + sidecars under `vector/**`.

### Slice D — Gates

- [ ] `pnpm quality:full`
- [ ] Cross-model QA + `prepr:gate` + PR + `pr:review`

## Automated verification

- `pnpm --filter …` package tests for quality + alexa-tools + alexa-sim
- `pnpm quality:full`
- `pnpm prepr:gate` before PR

## Manual verification

- `list_fixtures` shows both NE datasets with NaturalEarth license and scale note.
- Validate clean + demo-errors; explain/export same run; export metadata shows provenance parameters.

## Stop conditions

- NE crop exceeds size/feature/ring limits after honest selection.
- Clean baseline unexpectedly huge finding set that cannot be documented honestly without inventing ids incorrectly.
- Plan mismatch on license wording requiring human legal call.

## Plan mismatch protocol

1. Stop.
2. Document expected vs found.
3. Explain why it matters.
4. Propose options.
5. Ask for approval before continuing.
