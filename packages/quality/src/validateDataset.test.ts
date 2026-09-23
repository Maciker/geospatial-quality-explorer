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

  it("names and versions the geometry engine", () => {
    expect(polygonEngine.name).toBe("planar-polygon-engine");
    expect(polygonEngine.version).toBe("1.0.0");
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
