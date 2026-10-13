import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { InMemoryValidationRunRepository } from "./domain/InMemoryValidationRunRepository.js";
import { PlanarPolygonEngine } from "./infrastructure/PlanarPolygonEngine.js";
import { Sha256Digest } from "./infrastructure/Sha256Digest.js";
import { validateDataset } from "./application/validateDataset.js";

const digest = new Sha256Digest();
const engine = new PlanarPolygonEngine();
const startedAt = new Date("2026-09-23T00:00:00.000Z");

function fixtureBytes(name: string): Buffer {
  return readFileSync(new URL(`../fixtures/vector/${name}.geojson`, import.meta.url));
}

function expectedPairs(name: string): Array<{ ruleId: string; featureId: string }> {
  return JSON.parse(readFileSync(new URL(`../fixtures/expected/${name}.json`, import.meta.url), "utf8")) as Array<{ ruleId: string; featureId: string }>;
}

function validateNamed(name: string, sourceCrs = "EPSG:4326") {
  const sourceBytes = fixtureBytes(name);
  return validateDataset({
    collection: JSON.parse(sourceBytes.toString("utf8")) as unknown,
    sourceBytes,
    declaration: { name, sourceCrs, license: "CC0-1.0", parameters: {} },
    digest,
    engine,
    startedAt,
    completedAt: startedAt,
  });
}

describe("The vector contract", () => {
  it("rejects a deprecated crs member instead of guessing a CRS", () => {
    const source = Buffer.from(JSON.stringify({ type: "FeatureCollection", crs: { type: "name" }, features: [] }));

    expect(() => validateDataset({
      collection: JSON.parse(source.toString("utf8")) as unknown,
      sourceBytes: source,
      declaration: { name: "crs", sourceCrs: "EPSG:4326", license: "CC0-1.0", parameters: {} },
      digest,
      engine,
      startedAt,
      completedAt: startedAt,
    })).toThrow(/crs members are not accepted/);
  });

  it("rejects EPSG:4326 coordinates outside longitude and latitude bounds", () => {
    const source = Buffer.from(JSON.stringify({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        id: "utm-labelled-as-wgs84",
        properties: {},
        geometry: { type: "Polygon", coordinates: [[[500000, 4649776], [500100, 4649776], [500100, 4649876], [500000, 4649776]]] },
      }],
    }));

    expect(() => validateDataset({
      collection: JSON.parse(source.toString("utf8")) as unknown,
      sourceBytes: source,
      declaration: { name: "range", sourceCrs: "EPSG:4326", license: "CC0-1.0", parameters: {} },
      digest,
      engine,
      startedAt,
      completedAt: startedAt,
    })).toThrow(/position\.out_of_range/);
  });

  it("does not apply WGS84 bounds to a projected CRS", () => {
    const source = Buffer.from(JSON.stringify({
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        id: "utm",
        properties: {},
        geometry: { type: "Polygon", coordinates: [[[500000, 4649776], [500100, 4649776], [500100, 4649876], [500000, 4649776]]] },
      }],
    }));

    const run = validateDataset({
      collection: JSON.parse(source.toString("utf8")) as unknown,
      sourceBytes: source,
      declaration: { name: "utm", sourceCrs: "EPSG:25830", license: "CC0-1.0", parameters: {} },
      digest,
      engine,
      startedAt,
      completedAt: startedAt,
    });

    expect(run.findings).toEqual([]);
  });

  it("rejects a missing source CRS", () => {
    const source = fixtureBytes("clean");

    expect(() => validateDataset({
      collection: JSON.parse(source.toString("utf8")) as unknown,
      sourceBytes: source,
      declaration: { name: "clean", sourceCrs: "WGS84", license: "CC0-1.0", parameters: {} },
      digest,
      engine,
      startedAt,
      completedAt: startedAt,
    })).toThrow(/never inferred/);
  });
});

describe("The reference fixtures", () => {
  it.each(["clean", "empty-geometry", "duplicate-ids", "invalid-polygon", "valid-hole", "multipolygon", "portfolio"])(
    "matches the reviewed findings for %s",
    (name) => {
      const run = validateNamed(name);

      expect(run.findings.map((finding) => ({ ruleId: finding.ruleId, featureId: finding.featureId }))).toEqual(expectedPairs(name));
    },
  );

  it("keeps duplicate polygons available for review", () => {
    const run = validateNamed("duplicate-ids");

    expect(run.findings.every((finding) => finding.geometry?.type === "Polygon")).toBe(true);
  });

  it("keeps the bowtie coordinates unchanged", () => {
    const run = validateNamed("invalid-polygon");
    const geometry = run.findings[0]?.geometry;

    expect(geometry).toEqual({
      type: "Polygon",
      coordinates: [[[0, 0], [1, 1], [0, 1], [1, 0], [0, 0]]],
    });
  });

  it("omits finding geometries when the declared CRS is not EPSG:4326", () => {
    const run = validateNamed("invalid-polygon", "EPSG:25830");

    expect(run.findings[0]?.geometry).toBeNull();
    expect(run.limitations.some((limitation) => limitation.includes("not EPSG:4326"))).toBe(true);
  });

  it("repeats the same findings and run id for the same input", () => {
    const first = validateNamed("portfolio");
    const second = validateNamed("portfolio");

    expect(second.runId).toBe(first.runId);
    expect(second.findings).toEqual(first.findings);
  });
});

describe("The planar polygon engine", () => {
  const polygonEngine = new PlanarPolygonEngine();

  const square = (minimum: number, maximum: number): Array<[number, number]> => [
    [minimum, minimum], [maximum, minimum], [maximum, maximum], [minimum, maximum], [minimum, minimum],
  ];
  const assessPolygon = (coordinates: Array<Array<[number, number]>>) =>
    polygonEngine.assess({ kind: "polygon", geometry: { type: "Polygon", coordinates } });
  const assessMultiPolygon = (coordinates: Array<Array<Array<[number, number]>>>) =>
    polygonEngine.assess({ kind: "multipolygon", geometry: { type: "MultiPolygon", coordinates } });

  it("names and versions the geometry engine", () => {
    expect(polygonEngine.name).toBe("planar-polygon-engine");
    expect(polygonEngine.version).toBe("1.1.0");
  });

  it("rejects a collinear spike that doubles back on itself", () => {
    expect(assessPolygon([[[0, 0], [2, 0], [1, 0], [1, 1], [0, 0]]])).toEqual({ status: "invalid", reason: "self-intersection" });
  });

  it("rejects a ring that touches itself at a vertex", () => {
    expect(assessPolygon([[[0, 0], [2, 0], [1, 1], [2, 2], [0, 2], [1, 1], [0, 0]]])).toEqual({ status: "invalid", reason: "self-intersection" });
  });

  it("rejects a ring with zero area", () => {
    expect(assessPolygon([[[0, 0], [1, 0], [2, 0], [0, 0]]])).toEqual({ status: "invalid", reason: "ring-degenerate" });
  });

  it("accepts repeated consecutive positions", () => {
    expect(assessPolygon([[[0, 0], [1, 0], [1, 0], [1, 1], [0, 1], [0, 0]]])).toEqual({ status: "valid" });
  });

  it("rejects holes that overlap each other", () => {
    expect(assessPolygon([square(0, 10), square(1, 5), square(2, 6)])).toEqual({ status: "invalid", reason: "holes-overlap" });
  });

  it("rejects a hole nested inside another hole", () => {
    expect(assessPolygon([square(0, 10), square(1, 8), square(2, 3)])).toEqual({ status: "invalid", reason: "holes-overlap" });
  });

  it("accepts separate holes and a hole touching the exterior at one point", () => {
    expect(assessPolygon([square(0, 10), square(1, 3), square(5, 7)])).toEqual({ status: "valid" });
    expect(assessPolygon([square(0, 10), [[0, 5], [5, 2], [5, 8], [0, 5]]])).toEqual({ status: "valid" });
  });

  it("rejects MultiPolygon parts that overlap", () => {
    expect(assessMultiPolygon([[square(0, 2)], [square(1, 3)]])).toEqual({ status: "invalid", reason: "parts-overlap" });
  });

  it("rejects a MultiPolygon part inside another part", () => {
    expect(assessMultiPolygon([[square(0, 10)], [square(2, 3)]])).toEqual({ status: "invalid", reason: "parts-overlap" });
  });

  it("accepts an island inside another part's hole and parts touching at a corner", () => {
    expect(assessMultiPolygon([[square(0, 10), square(2, 8)], [square(4, 6)]])).toEqual({ status: "valid" });
    expect(assessMultiPolygon([[square(0, 1)], [square(1, 2)]])).toEqual({ status: "valid" });
  });

  it("accepts a hole and rejects a hole outside the exterior", () => {
    expect(polygonEngine.assess({
      kind: "polygon",
      geometry: {
        type: "Polygon",
        coordinates: [
          [[0, 0], [6, 0], [6, 6], [0, 6], [0, 0]],
          [[10, 10], [12, 10], [12, 12], [10, 12], [10, 10]],
        ],
      },
    })).toEqual({ status: "invalid", reason: "hole-outside" });
  });

  it("rejects an open ring", () => {
    expect(polygonEngine.assess({
      kind: "polygon",
      geometry: { type: "Polygon", coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1]]] },
    })).toEqual({ status: "invalid", reason: "ring-open" });
  });
});

describe("The validation run repository", () => {
  it("keeps a completed run and replaces a failed attempt", async () => {
    const repository = new InMemoryValidationRunRepository();
    const succeeded = validateNamed("clean");
    const failed = { ...succeeded, status: "failed" as const, findings: [], failureMessage: "interrupted" };

    await repository.save(failed);
    await repository.save(succeeded);
    await repository.save(succeeded);

    const stored = (await repository.findById(succeeded.runId)).orElseThrow(new Error("missing run"));
    expect(stored.status).toBe("succeeded");
    expect(stored.findings).toEqual(succeeded.findings);
  });

  it("refuses to replace a completed run with a different dataset", async () => {
    const repository = new InMemoryValidationRunRepository();
    const succeeded = validateNamed("clean");
    await repository.save(succeeded);

    await expect(repository.save({ ...succeeded, sourceHash: "different" })).rejects.toThrow(/immutable/);
  });
});

describe("The SHA-256 digest", () => {
  it("matches the empty-string test vector", () => {
    expect(digest.sha256("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });
});
