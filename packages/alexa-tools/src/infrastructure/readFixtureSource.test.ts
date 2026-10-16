import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { readFixtureSource } from "./readFixtureSource.js";

const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../../quality/fixtures/vector");

describe("readFixtureSource", () => {
  it("returns the Natural Earth FeatureCollection with provenance metadata", () => {
    const result = readFixtureSource(fixturesDirectory, "ne-admin0-westeurope");
    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.license).toBe("NaturalEarth-public-domain");
    expect(result.sourceCrs).toBe("EPSG:4326");
    expect(result.sourceHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.collection.type).toBe("FeatureCollection");
    expect(result.collection.features.length).toBeGreaterThan(0);
    expect(result.scaleNote).toMatch(/1:110m/i);
  });

  it("rejects unknown and malformed fixture ids", () => {
    expect(readFixtureSource(fixturesDirectory, "missing-dataset")).toMatchObject({ error: "not_found" });
    expect(readFixtureSource(fixturesDirectory, "Bad_Id")).toMatchObject({ error: "invalid_request" });
  });
});
