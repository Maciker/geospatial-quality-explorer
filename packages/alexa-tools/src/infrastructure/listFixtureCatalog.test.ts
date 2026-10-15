import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { listFixtureCatalog } from "./listFixtureCatalog.js";

const realFixtures = join(dirname(fileURLToPath(import.meta.url)), "../../../quality/fixtures/vector");

describe("listFixtureCatalog", () => {
  it("reads per-dataset license and CRS from fixture sidecars", () => {
    const fixtures = listFixtureCatalog(realFixtures);
    const portfolio = fixtures.find((fixture) => fixture.fixtureId === "portfolio");
    const ne = fixtures.find((fixture) => fixture.fixtureId === "ne-admin0-westeurope");
    const neErrors = fixtures.find((fixture) => fixture.fixtureId === "ne-admin0-westeurope-demo-errors");

    expect(portfolio?.license).toBe("CC0-1.0");
    expect(portfolio?.defaultSourceCrs).toBe("EPSG:4326");
    expect(ne?.license).toBe("NaturalEarth-public-domain");
    expect(ne?.defaultSourceCrs).toBe("EPSG:4326");
    expect(ne?.scaleNote).toMatch(/1:110m/i);
    expect(neErrors?.didacticNote).toMatch(/errors introduced/i);
    expect(neErrors?.license).toBe("NaturalEarth-public-domain");
  });

  it("rejects a geojson fixture that has no sidecar metadata", () => {
    const dir = mkdtempSync(join(tmpdir(), "fixture-catalog-"));
    writeFileSync(join(dir, "orphan.geojson"), JSON.stringify({ type: "FeatureCollection", features: [] }));

    expect(() => listFixtureCatalog(dir)).toThrow(/orphan\.fixture\.json/);
  });

  it("does not invent CC0 for a Natural Earth sidecar", () => {
    const dir = mkdtempSync(join(tmpdir(), "fixture-catalog-"));
    writeFileSync(join(dir, "sample.geojson"), JSON.stringify({ type: "FeatureCollection", features: [] }));
    writeFileSync(
      join(dir, "sample.fixture.json"),
      JSON.stringify({
        label: "Sample",
        license: "NaturalEarth-public-domain",
        defaultSourceCrs: "EPSG:4326",
        origin: "https://www.naturalearthdata.com/",
      }),
    );

    const [fixture] = listFixtureCatalog(dir);
    expect(fixture?.license).toBe("NaturalEarth-public-domain");
    expect(fixture?.license).not.toBe("CC0-1.0");
  });
});
