import type { Pool, PoolClient } from "pg";
import { Maybe, decideSave, type ValidationRun, type ValidationRunRepository } from "../../quality/src/index.js";
import { runInTransaction } from "./applyMigrations.js";

type RunRow = {
  run_id: string;
  dataset_name: string;
  source_hash: string;
  source_crs: string;
  license: string;
  feature_count: number;
  ruleset_id: string;
  ruleset_version: string;
  parameters: Record<string, string>;
  status: ValidationRun["status"];
  limitations: string[];
  findings: ValidationRun["findings"];
  started_at: Date;
  completed_at: Date;
  failure_message: string | null;
};

export class PostgisValidationRunRepository implements ValidationRunRepository {
  constructor(private readonly pool: Pool) {}

  async save(run: ValidationRun): Promise<void> {
    await runInTransaction(this.pool, async (client) => {
      const existing = await client.query<{ status: ValidationRun["status"]; source_hash: string }>(
        "SELECT status, source_hash FROM quality.validation_runs WHERE run_id = $1 FOR UPDATE",
        [run.runId],
      );
      const row = existing.rows[0];
      const decision = decideSave(
        row ? { status: row.status, sourceHash: row.source_hash } : null,
        { status: run.status, sourceHash: run.sourceHash },
      );
      if (decision === "keep") return;
      if (decision === "replace") {
        await client.query("DELETE FROM quality.finding_geometries WHERE run_id = $1", [run.runId]);
        await client.query("DELETE FROM quality.validation_runs WHERE run_id = $1", [run.runId]);
      }
      await insertRun(client, run);
    });
  }

  async findById(runId: string): Promise<Maybe<ValidationRun>> {
    const result = await this.pool.query<RunRow>("SELECT * FROM quality.validation_runs WHERE run_id = $1", [runId]);
    const row = result.rows[0];
    if (!row) return Maybe.none();
    return Maybe.some(toRun(row));
  }
}

async function insertRun(client: PoolClient, run: ValidationRun): Promise<void> {
  await client.query(
    `INSERT INTO quality.validation_runs (
      run_id, dataset_name, source_hash, source_crs, license, feature_count,
      ruleset_id, ruleset_version, parameters, status, limitations, findings,
      started_at, completed_at, failure_message
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::jsonb,$12::jsonb,$13,$14,$15)`,
    [
      run.runId,
      run.datasetName,
      run.sourceHash,
      run.sourceCrs,
      run.license,
      run.featureCount,
      run.rulesetId,
      run.rulesetVersion,
      JSON.stringify(run.parameters),
      run.status,
      JSON.stringify(run.limitations),
      JSON.stringify(run.findings),
      run.startedAt,
      run.completedAt,
      run.failureMessage,
    ],
  );
  for (const finding of run.findings) {
    await client.query(
      `INSERT INTO quality.finding_geometries (
        finding_id, run_id, rule_id, severity, feature_id, feature_index,
        explanation, suggested_action, geometry
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,
        CASE WHEN $9::text IS NULL THEN NULL ELSE ST_SetSRID(ST_GeomFromGeoJSON($9), 4326) END
      )`,
      [
        finding.findingId,
        run.runId,
        finding.ruleId,
        finding.severity,
        finding.featureId,
        finding.featureIndex,
        finding.explanation,
        finding.suggestedAction,
        finding.geometry === null ? null : JSON.stringify(finding.geometry),
      ],
    );
  }
}

function toRun(row: RunRow): ValidationRun {
  return {
    runId: row.run_id,
    datasetName: row.dataset_name,
    sourceHash: row.source_hash,
    sourceCrs: row.source_crs,
    license: row.license,
    featureCount: row.feature_count,
    rulesetId: row.ruleset_id,
    rulesetVersion: row.ruleset_version,
    parameters: row.parameters,
    status: row.status,
    limitations: row.limitations,
    findings: row.findings,
    startedAt: row.started_at.toISOString(),
    completedAt: row.completed_at.toISOString(),
    failureMessage: row.failure_message,
  };
}
