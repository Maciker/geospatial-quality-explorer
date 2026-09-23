import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { describe, expect, it } from "vitest";
import { PlanarPolygonEngine, Sha256Digest, validateDataset } from "../../quality/src/index.js";
import { LOCAL_POSTGIS_URL, applyMigrations, openPostgis, runInTransaction } from "./index.js";

const databaseUrl = process.env.GEOSPATIAL_POSTGIS_URL ?? LOCAL_POSTGIS_URL;
const startedAt = new Date("2026-09-23T00:00:00.000Z");
const portfolioText = readFileSync(new URL("../../quality/fixtures/vector/portfolio.geojson", import.meta.url));

function portfolioRun() {
  return validateDataset({
    collection: JSON.parse(portfolioText.toString("utf8")) as unknown,
    sourceBytes: portfolioText,
    declaration: { name: "portfolio", sourceCrs: "EPSG:4326", license: "CC0-1.0", parameters: {} },
    digest: new Sha256Digest(),
    engine: new PlanarPolygonEngine(),
    startedAt,
    completedAt: startedAt,
  });
}

describe("The PostGIS validation store", () => {
  it("applies the schema twice without duplicating versions", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      await applyMigrations(pool);
      const second = await applyMigrations(pool);
      const versions = await pool.query("SELECT version FROM quality.schema_migrations");
      expect(second).toEqual([]);
      expect(versions.rows.map((row: { version: string }) => row.version)).toEqual(["001_quality_schema"]);
    } finally {
      await pool.end();
    }
  });

  it("returns the same findings after a new connection", async () => {
    const run = portfolioRun();
    const invalidId = run.findings.find((finding) => finding.ruleId === "geometry.invalid")?.findingId;
    const cleanup = new Pool({ connectionString: databaseUrl });
    await cleanup.query("DELETE FROM quality.finding_geometries WHERE run_id = $1", [run.runId]);
    await cleanup.query("DELETE FROM quality.validation_runs WHERE run_id = $1", [run.runId]);
    await cleanup.end();
    const first = await openPostgis(databaseUrl);
    await first.repository.save(run);
    await first.repository.save(run);
    await first.close();
    const second = await openPostgis(databaseUrl);
    const pool = new Pool({ connectionString: databaseUrl });
    try {
      const stored = (await second.repository.findById(run.runId)).orElseThrow(new Error("missing run"));
      expect(stored.findings).toEqual(run.findings);
      const spatial = await pool.query<{ geometry_type: string }>(
        "SELECT ST_GeometryType(geometry) AS geometry_type FROM quality.finding_geometries WHERE finding_id = $1",
        [invalidId],
      );
      expect(spatial.rows[0]?.geometry_type).toBe("ST_Polygon");
    } finally {
      await pool.end();
      await second.close();
    }
  });

  it("rolls back a run when the transaction fails", async () => {
    const pool = new Pool({ connectionString: databaseUrl });
    const runId = "rollback-run";
    try {
      await applyMigrations(pool);
      await expect(runInTransaction(pool, async (client) => {
        await client.query(
          `INSERT INTO quality.validation_runs (
            run_id, dataset_name, source_hash, source_crs, license, feature_count,
            ruleset_id, ruleset_version, parameters, status, limitations, findings,
            started_at, completed_at, failure_message
          ) VALUES ($1,'n','h','EPSG:4326','CC0-1.0',0,'vector-core','1.0.0','{}','succeeded','[]','[]',NOW(),NOW(),NULL)`,
          [runId],
        );
        throw new Error("fail the transaction");
      })).rejects.toThrow(/fail the transaction/);
      const stored = await pool.query("SELECT run_id FROM quality.validation_runs WHERE run_id = $1", [runId]);
      expect(stored.rowCount).toBe(0);
    } finally {
      await pool.end();
    }
  });
});
