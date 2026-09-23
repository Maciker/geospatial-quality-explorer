import { readFileSync } from "node:fs";
import type { Pool, PoolClient } from "pg";

const MIGRATION_VERSION = "001_quality_schema";

export async function applyMigrations(pool: Pool): Promise<readonly string[]> {
  const sql = readFileSync(new URL("../migrations/001_quality_schema.sql", import.meta.url), "utf8");
  return runInTransaction(pool, async (client) => {
    await client.query(sql);
    const existing = await client.query("SELECT version FROM quality.schema_migrations WHERE version = $1", [MIGRATION_VERSION]);
    if ((existing.rowCount ?? 0) > 0) return [];
    await client.query("INSERT INTO quality.schema_migrations (version) VALUES ($1)", [MIGRATION_VERSION]);
    return [MIGRATION_VERSION];
  });
}

export async function runInTransaction<T>(pool: Pool, work: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
