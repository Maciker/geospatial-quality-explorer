import { describe, expect, it } from "vitest";
import { buildProvenanceLabel } from "./provenanceLabel";

const layer = {
  label: "Natural Earth Admin 0 Western Europe and neighbours (demo errors)",
  license: "NaturalEarth-public-domain",
  sourceCrs: "EPSG:4326",
  scaleNote: "Cartographic 1:110m national boundaries.",
};

describe("buildProvenanceLabel", () => {
  it("leads with the licence, the CRS and the hash so a clamped note still shows them", () => {
    const label = buildProvenanceLabel(layer, "bfe80be1c8f795a81f429fab62a2dc94ba9c43f61e466d9322e4718d28c8b4a6");

    expect(label.startsWith("NaturalEarth-public-domain · EPSG:4326 · hash bfe80be1c8f7…")).toBe(true);
    expect(label).toContain(layer.label);
    expect(label.endsWith(layer.scaleNote)).toBe(true);
    expect(label.indexOf(layer.label)).toBeGreaterThan(label.indexOf("EPSG:4326"));
  });

  it("leaves out the hash and the scale note when they are not known", () => {
    expect(buildProvenanceLabel({ ...layer, scaleNote: undefined }, null))
      .toBe(`NaturalEarth-public-domain · EPSG:4326 · ${layer.label}`);
  });
});
