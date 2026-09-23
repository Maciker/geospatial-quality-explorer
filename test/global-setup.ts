import { execSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const databaseUrl = process.env.GEOSPATIAL_POSTGIS_URL
  ?? "postgres://explorer:explorer@127.0.0.1:5432/geospatial_quality_explorer";

export default function globalSetup(): void {
  const env = { ...process.env, GEOSPATIAL_POSTGIS_URL: databaseUrl };
  execSync("pnpm exec tsx apps/cli/src/main.ts migrate", { env, stdio: "inherit" });
  const validated = spawnSync("pnpm", [
    "exec",
    "tsx",
    "apps/cli/src/main.ts",
    "validate",
    "--input",
    "packages/quality/fixtures/vector/portfolio.geojson",
    "--source-crs",
    "EPSG:4326",
    "--name",
    "portfolio",
    "--license",
    "CC0-1.0",
  ], { env, encoding: "utf8" });
  if (validated.status !== 2) {
    throw new Error(validated.stderr || validated.stdout || "Portfolio validation did not report findings.");
  }
  const output = validated.stdout;
  const runId = /^Run ([a-f0-9]{64})/m.exec(output)?.[1];
  if (!runId) throw new Error(`CLI output did not include a run id.\n${output}`);
  writeFileSync("/tmp/geospatial-quality-explorer-run-id", runId);
}
