# Natural Earth 110m Admin 0 — provenance

## Upstream

| Field | Value |
| --- | --- |
| Product | Natural Earth Admin 0 Countries, 1:110m cultural vectors |
| Version | 5.1.1 (from `ne_110m_admin_0_countries.VERSION.txt`) |
| Download URL | https://naciscdn.org/naturalearth/110m/cultural/ne_110m_admin_0_countries.zip |
| Project page | https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/ |
| Terms | https://www.naturalearthdata.com/about/terms-of-use/ |
| Downloaded at | 2026-10-15 (Europe/Madrid agent run) |
| Declared CRS | EPSG:4326 (WGS84 geographic; shapefile `.prj` is GCS_WGS_1984) |

## Hashes

| Artifact | SHA-256 |
| --- | --- |
| `ne_110m_admin_0_countries.zip` | `0f243aeac8ac6cf26f0417285b0bd33ac47f1b5bdb719fd3e0df37d03ea37110` |
| `vector/ne-admin0-westeurope.geojson` | `389d16699cad09d128943dfffc63e616f6e2e7b4c6987698be14a6671a9aeb08` |
| `vector/ne-admin0-westeurope-demo-errors.geojson` | `bfe80be1c8f795a81f429fab62a2dc94ba9c43f61e466d9322e4718d28c8b4a6` |

## Selection / transformation

1. Keep the zip unmodified as the upstream reference.
2. Select features whose `ADM0_A3` is in: AUT, BEL, CHE, DEU, DNK, ESP, FRA, GBR, IRL, ISL, ITA, LUX, NLD, NOR, PRT, SWE (Western Europe / Iberia). Microstates AND, MCO, LIE, MLT are absent at 1:110m and are omitted.
3. Set `Feature.id` from `ADM0_A3`. Keep properties `NAME`, `ADM0_A3`, `ISO_A3`, `ADMIN`.
4. Round coordinates to 6 decimal places for stable JSON. Do **not** repair, snap, or reproject geometries. 1:110m country polygons may include overseas territories (for example French Guiana on FRA); this sample is cartographic Admin 0, not a cadastral Western Europe clip.
5. Write catalog file `ne-admin0-westeurope.geojson`.
6. Derive `ne-admin0-westeurope-demo-errors.geojson` from that clean file: Portugal → Iberian bowtie (`geometry.invalid`); duplicate Spain id; add `DEMO-EMPTY` with null geometry. Label: *Real data; errors introduced for the demo.*

## Reproducibility

From `packages/quality`:

```bash
# Rebuild clean GeoJSON from the frozen zip (requires: pip install pyshp)
python3 scripts/extract-ne-admin0-westeurope.py

# Rebuild didactic copy from the clean GeoJSON (TypeScript, offline)
pnpm --filter @gis/quality exec tsx scripts/build-ne-admin0-demo-errors.ts

# Verify published SHA-256 digests + didactic rebuild stability
pnpm --filter @gis/quality exec tsx scripts/verify-ne-admin0-hashes.ts
```

`extract-ne-admin0-westeurope.py` and `verify-ne-admin0-hashes.ts` exit non-zero on digest mismatch. Vitest also runs the hash verification.
