/**
 * Rebuild `ne-admin0-westeurope-demo-errors.geojson` from the clean Western Europe sample.
 *
 * Offline. Does not download Natural Earth. Injected defects are intentional for the demo.
 *
 * Usage (from repo root):
 *   pnpm --filter @gis/quality exec tsx scripts/build-ne-admin0-demo-errors.ts
 */
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const cleanPath = join(root, "fixtures/vector/ne-admin0-westeurope.geojson");
const outPath = join(root, "fixtures/vector/ne-admin0-westeurope-demo-errors.geojson");

type Feature = {
  type: "Feature";
  id: string;
  properties: Record<string, string>;
  geometry: unknown;
};

type FeatureCollection = { type: "FeatureCollection"; features: Feature[] };

const source = JSON.parse(readFileSync(cleanPath, "utf8")) as FeatureCollection;
const features: Feature[] = structuredClone(source.features);

const esp = features.find((feature) => feature.id === "ESP");
const prt = features.find((feature) => feature.id === "PRT");
if (!esp || !prt) throw new Error("Expected ESP and PRT in the clean Western Europe sample");

prt.geometry = {
  type: "Polygon",
  coordinates: [[[-9.5, 38.5], [-7.5, 40.5], [-9.5, 40.5], [-7.5, 38.5], [-9.5, 38.5]]],
};
prt.properties = {
  ...prt.properties,
  NAME: "Portugal (demo invalid geometry)",
  demo_error: "geometry.invalid",
};

esp.properties = { ...esp.properties, demo_error: "identifier.duplicate" };
features.push({
  type: "Feature",
  id: "ESP",
  properties: {
    ...esp.properties,
    NAME: "Spain (demo duplicate id)",
    demo_error: "identifier.duplicate",
  },
  geometry: structuredClone(esp.geometry),
});

features.push({
  type: "Feature",
  id: "DEMO-EMPTY",
  properties: {
    NAME: "Demo missing geometry",
    ADM0_A3: "DEM",
    ISO_A3: "-99",
    ADMIN: "Demo empty",
    demo_error: "geometry.empty",
  },
  geometry: null,
});

features.sort((left, right) => {
  const byId = String(left.id).localeCompare(String(right.id));
  if (byId !== 0) return byId;
  return (left.properties.NAME ?? "").localeCompare(right.properties.NAME ?? "");
});

const text = JSON.stringify({ type: "FeatureCollection", features }, null, 0);
writeFileSync(outPath, text);
const hash = createHash("sha256").update(text).digest("hex");
process.stdout.write(`${outPath}\nsha256 ${hash}\nfeatures ${features.length}\n`);
