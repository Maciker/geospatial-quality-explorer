import { readdirSync } from "node:fs";
import { join } from "node:path";
import type { FixtureSummary } from "../domain/toolContracts.js";

export function listFixtureCatalog(fixturesDirectory: string): readonly FixtureSummary[] {
  const names = readdirSync(fixturesDirectory)
    .filter((name) => name.endsWith(".geojson"))
    .map((name) => name.slice(0, -".geojson".length))
    .sort((left, right) => left.localeCompare(right));
  return names.map((fixtureId) => ({
    fixtureId,
    label: fixtureId.replace(/-/g, " "),
    license: "CC0-1.0",
    defaultSourceCrs: "EPSG:4326",
  }));
}

export function resolveFixturePath(fixturesDirectory: string, fixtureId: string): string {
  return join(fixturesDirectory, `${fixtureId}.geojson`);
}
