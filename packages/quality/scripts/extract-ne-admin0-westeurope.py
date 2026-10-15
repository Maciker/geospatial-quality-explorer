#!/usr/bin/env python3
"""Rebuild ne-admin0-westeurope.geojson from the frozen Natural Earth zip.

Requires: pip install pyshp
Does not download. Reads fixtures/provenance/natural-earth-110m-admin0/ne_110m_admin_0_countries.zip
and writes fixtures/vector/ne-admin0-westeurope.geojson. Exits non-zero if the SHA-256
does not match the digest published in PROVENANCE.md.

Usage (from packages/quality):
  python3 scripts/extract-ne-admin0-westeurope.py
"""

from __future__ import annotations

import hashlib
import json
import tempfile
import zipfile
from pathlib import Path

try:
    import shapefile
except ImportError as exc:  # pragma: no cover
    raise SystemExit("Install pyshp: pip install pyshp") from exc

ROOT = Path(__file__).resolve().parents[1]
ZIP_PATH = ROOT / "fixtures/provenance/natural-earth-110m-admin0/ne_110m_admin_0_countries.zip"
OUT_PATH = ROOT / "fixtures/vector/ne-admin0-westeurope.geojson"
EXPECTED_SHA256 = "389d16699cad09d128943dfffc63e616f6e2e7b4c6987698be14a6671a9aeb08"
ALLOW = {
    "AUT",
    "BEL",
    "CHE",
    "DEU",
    "DNK",
    "ESP",
    "FRA",
    "GBR",
    "IRL",
    "ISL",
    "ITA",
    "LUX",
    "NLD",
    "NOR",
    "PRT",
    "SWE",
}


def shape_to_geojson_geom(shape: shapefile.Shape) -> dict:
    if shape.shapeType not in (5, 15, 25):
        raise SystemExit(f"unexpected shapeType {shape.shapeType}")
    parts = list(shape.parts) + [len(shape.points)]
    rings: list[list[list[float]]] = []
    for index in range(len(parts) - 1):
        pts = shape.points[parts[index] : parts[index + 1]]
        ring = [[round(x, 6), round(y, 6)] for x, y in pts]
        if ring and ring[0] != ring[-1]:
            ring.append(ring[0][:])
        rings.append(ring)
    if len(rings) == 1:
        return {"type": "Polygon", "coordinates": rings}
    return {"type": "MultiPolygon", "coordinates": [[ring] for ring in rings]}


def main() -> None:
    if not ZIP_PATH.is_file():
        raise SystemExit(f"missing frozen zip: {ZIP_PATH}")
    with tempfile.TemporaryDirectory() as tmp:
        with zipfile.ZipFile(ZIP_PATH) as archive:
            archive.extractall(tmp)
        base = Path(tmp) / "ne_110m_admin_0_countries"
        reader = shapefile.Reader(str(base))
        fields = [field[0] for field in reader.fields[1:]]
        idx = {name: fields.index(name) for name in ("ADM0_A3", "NAME", "ISO_A3", "ADMIN")}
        features = []
        for record in reader.iterShapeRecords():
            adm0 = record.record[idx["ADM0_A3"]]
            if adm0 not in ALLOW:
                continue
            features.append(
                {
                    "type": "Feature",
                    "id": adm0,
                    "properties": {
                        "NAME": record.record[idx["NAME"]],
                        "ADM0_A3": adm0,
                        "ISO_A3": record.record[idx["ISO_A3"]],
                        "ADMIN": record.record[idx["ADMIN"]],
                    },
                    "geometry": shape_to_geojson_geom(record.shape),
                }
            )
        features.sort(key=lambda feature: feature["id"])
        text = json.dumps({"type": "FeatureCollection", "features": features}, ensure_ascii=False, separators=(",", ":"))
        digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
        if digest != EXPECTED_SHA256:
            raise SystemExit(f"clean GeoJSON digest mismatch\n expected {EXPECTED_SHA256}\n actual   {digest}")
        OUT_PATH.write_text(text)
        print(f"wrote {OUT_PATH} sha256 {digest}")


if __name__ == "__main__":
    main()
