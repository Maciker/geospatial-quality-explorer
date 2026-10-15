# Fixture licenses

This directory holds two kinds of committed samples.

## Synthetic fixtures (CC0)

The original synthetic GeoJSON files (`clean`, `portfolio`, `duplicate-ids`, `empty-geometry`, `invalid-polygon`, `multipolygon`, `valid-hole`) are geometries created for Geospatial Quality Explorer. They do not depict a private or surveyed place.

They are dedicated to the public domain under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

## Natural Earth samples (public domain per Natural Earth terms)

`ne-admin0-westeurope.geojson` and `ne-admin0-westeurope-demo-errors.geojson` are derived from [Natural Earth Admin 0 Countries 1:110m](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/110m-admin-0-countries/).

Natural Earth data is placed in the public domain under the [Natural Earth terms of use](https://www.naturalearthdata.com/about/terms-of-use/). Do **not** relabel these files as CC0-1.0; the run/license field uses `NaturalEarth-public-domain`.

The `*-demo-errors` copy intentionally injects invalid geometry, a duplicate id, and a missing geometry for the demo. Those defects are **not** present in Natural Earth and must not be attributed to the upstream source. See each `*.fixture.json` sidecar and `provenance/natural-earth-110m-admin0/PROVENANCE.md`.
