import { describe, expect, it } from "vitest";
import { featuresForFit, toFindingMapFeatures, toSourceMapFeatures } from "./mapFeatures";

const samplePolygon = {
  type: "Polygon" as const,
  coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]],
};

describe("mapFeatures", () => {
  it("uses findingId as the MapLibre feature id so duplicate business ids do not collide", () => {
    const duplicateFinding = {
      ruleId: "identifier.duplicate",
      featureId: "ESP",
      severity: "error",
      explanation: "a",
      suggestedAction: "b",
      geometry: samplePolygon,
    };
    const features = toFindingMapFeatures([
      { ...duplicateFinding, findingId: "run:0:identifier.duplicate" },
      { ...duplicateFinding, findingId: "run:1:identifier.duplicate" },
    ]);
    expect(features.map((feature) => feature.id)).toEqual([
      "run:0:identifier.duplicate",
      "run:1:identifier.duplicate",
    ]);
    expect(features.every((feature) => feature.properties.role === "finding-overlay")).toBe(true);
  });

  it("omits findings without polygon geometry instead of inventing coordinates", () => {
    const features = toFindingMapFeatures([
      {
        findingId: "run:2:geometry.empty",
        ruleId: "geometry.empty",
        featureId: "DEMO-EMPTY",
        severity: "error",
        explanation: "empty",
        suggestedAction: "fix",
        geometry: null,
      },
    ]);
    expect(features).toEqual([]);
  });

  it("fits to finding overlays before the full source extent when findings exist", () => {
    const source = toSourceMapFeatures({
      features: [
        {
          id: "FRA",
          properties: { NAME: "France" },
          geometry: { type: "Polygon", coordinates: [[[-5, 42], [8, 42], [8, 51], [-5, 51], [-5, 42]]] },
        },
        {
          id: "GUF",
          properties: { NAME: "French Guiana" },
          geometry: { type: "Polygon", coordinates: [[[-55, 2], [-50, 2], [-50, 6], [-55, 6], [-55, 2]]] },
        },
      ],
    });
    const findings = toFindingMapFeatures([
      {
        findingId: "run:0:geometry.invalid",
        ruleId: "geometry.invalid",
        featureId: "PRT",
        severity: "error",
        explanation: "a",
        suggestedAction: "b",
        geometry: samplePolygon,
      },
    ]);
    expect(featuresForFit(source, findings, null)).toEqual(findings);
    expect(featuresForFit(source, findings, "run:0:geometry.invalid")).toEqual([findings[0]]);
    expect(featuresForFit(source, [], null)).toEqual(source);
  });

  it("keeps source feature ids distinct per row index", () => {
    const features = toSourceMapFeatures({
      features: [
        {
          id: "ESP",
          properties: { NAME: "Spain" },
          geometry: { type: "Polygon", coordinates: [[[-9, 36], [-1, 36], [-1, 43], [-9, 43], [-9, 36]]] },
        },
        {
          id: "ESP",
          properties: { NAME: "Spain duplicate" },
          geometry: { type: "Polygon", coordinates: [[[-9, 36], [-1, 36], [-1, 43], [-9, 43], [-9, 36]]] },
        },
      ],
    });
    expect(features.map((feature) => feature.id)).toEqual(["source:ESP:0", "source:ESP:1"]);
  });
});
