import { Pool } from "pg";
import { applyMigrations } from "./applyMigrations.js";
import { PostgisValidationRunRepository } from "./PostgisValidationRunRepository.js";

export { applyMigrations, runInTransaction } from "./applyMigrations.js";
export { PostgisValidationRunRepository } from "./PostgisValidationRunRepository.js";
export const LOCAL_POSTGIS_URL = "postgres://explorer:explorer@127.0.0.1:5432/geospatial_quality_explorer";

export async function openPostgis(databaseUrl: string): Promise<{
  repository: PostgisValidationRunRepository;
  applied: readonly string[];
  close: () => Promise<void>;
}> {
  const pool = new Pool({ connectionString: databaseUrl });
  const applied = await applyMigrations(pool);
  return { repository: new PostgisValidationRunRepository(pool), applied, close: () => pool.end() };
}
