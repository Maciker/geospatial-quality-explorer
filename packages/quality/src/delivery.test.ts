import { describe, expect, it } from "vitest";
import { buildQgisBundle } from "./application/qgisBundle.js";
import { assertReportRoundTrip, buildQualityReport, runFromReport } from "./application/qualityReport.js";
import { Sha256Digest } from "./infrastructure/Sha256Digest.js";
import { PlanarPolygonEngine } from "./infrastructure/PlanarPolygonEngine.js";
import { validateDataset } from "./application/validateDataset.js";
import { readFileSync } from "node:fs";

describe("The quality report", () => {
  it("round-trips identifiers, coordinates, and null geometries", () => {
    const sourceBytes = readFileSync(new URL("../fixtures/vector/portfolio.geojson", import.meta.url));
    const run = validateDataset({
      collection: JSON.parse(sourceBytes.toString("utf8")) as unknown,
      sourceBytes,
      declaration: { name: "portfolio", sourceCrs: "EPSG:4326", license: "CC0-1.0", parameters: { theme: "demo" } },
      digest: new Sha256Digest(),
      engine: new PlanarPolygonEngine(),
      startedAt: new Date("2026-09-23T00:00:00.000Z"),
      completedAt: new Date("2026-09-23T00:00:00.000Z"),
    });
    const report = buildQualityReport(run);
    assertReportRoundTrip(report);
    const restored = runFromReport(JSON.parse(JSON.stringify(report)) as typeof report);

    expect(report.countsBySeverity.error).toBe(run.findings.length);
    expect(report.licenseReferences).toEqual(["CC0-1.0"]);
    expect(report.limitations[0]).toContain("not a certification");
    expect(restored.findings).toEqual(run.findings);
    expect(restored.findings.some((finding) => finding.geometry === null)).toBe(true);
  });

  it("validates the portfolio fixture within one second", () => {
    const sourceBytes = readFileSync(new URL("../fixtures/vector/portfolio.geojson", import.meta.url));
    const started = Date.now();
    validateDataset({
      collection: JSON.parse(sourceBytes.toString("utf8")) as unknown,
      sourceBytes,
      declaration: { name: "portfolio", sourceCrs: "EPSG:4326", license: "CC0-1.0", parameters: {} },
      digest: new Sha256Digest(),
      engine: new PlanarPolygonEngine(),
      startedAt: new Date("2026-09-23T00:00:00.000Z"),
      completedAt: new Date("2026-09-23T00:00:00.000Z"),
    });
    expect(Date.now() - started).toBeLessThan(1000);
  });
});

describe("The QGIS bundle", () => {
  it("uses a relative GeoJSON path and severity field without Python", () => {
    const sourceBytes = readFileSync(new URL("../fixtures/vector/invalid-polygon.geojson", import.meta.url));
    const run = validateDataset({
      collection: JSON.parse(sourceBytes.toString("utf8")) as unknown,
      sourceBytes,
      declaration: { name: "invalid-polygon", sourceCrs: "EPSG:4326", license: "CC0-1.0", parameters: {} },
      digest: new Sha256Digest(),
      engine: new PlanarPolygonEngine(),
      startedAt: new Date("2026-09-23T00:00:00.000Z"),
      completedAt: new Date("2026-09-23T00:00:00.000Z"),
    });
    const bundle = buildQgisBundle(run);

    expect(bundle.project).toContain("./findings.geojson");
    expect(bundle.project).toContain("severity");
    expect(bundle.style).toContain('attr="severity"');
    expect(bundle.project).not.toContain(".py");
    expect(bundle.geojson).toContain("bowtie-1");
  });
});
