import { describe, expect, it } from "vitest";
import { toFindingMapFeatures, toSourceMapFeatures } from "./mapFeatures";

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
