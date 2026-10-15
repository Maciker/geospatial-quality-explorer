import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { FixtureSummary } from "../domain/toolContracts.js";

export type FixtureManifest = {
  readonly label: string;
  readonly license: string;
  readonly defaultSourceCrs: string;
  readonly origin?: string;
  readonly transformation?: string;
  readonly scaleNote?: string;
  readonly didacticNote?: string;
  readonly termsUrl?: string;
  readonly sourceVersion?: string;
  readonly downloadedAt?: string;
  readonly downloadUrl?: string;
  readonly parameters?: Readonly<Record<string, string>>;
};

export type FixtureCatalogEntry = FixtureSummary & {
  readonly parameters: Readonly<Record<string, string>>;
};

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value : undefined;
}

function readManifest(fixturesDirectory: string, fixtureId: string): FixtureManifest {
  const path = join(fixturesDirectory, `${fixtureId}.fixture.json`);
  if (!existsSync(path)) {
    throw new Error(`Missing fixture metadata sidecar ${fixtureId}.fixture.json`);
  }
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
  const label = optionalString(parsed.label);
  const license = optionalString(parsed.license);
  const defaultSourceCrs = optionalString(parsed.defaultSourceCrs);
  if (label === undefined) {
    throw new Error(`${fixtureId}.fixture.json must declare a non-empty label`);
  }
  if (license === undefined) {
    throw new Error(`${fixtureId}.fixture.json must declare a license`);
  }
  if (defaultSourceCrs === undefined || !/^EPSG:\d+$/.test(defaultSourceCrs)) {
    throw new Error(`${fixtureId}.fixture.json must declare defaultSourceCrs as EPSG:####`);
  }
  const origin = optionalString(parsed.origin);
  const transformation = optionalString(parsed.transformation);
  const scaleNote = optionalString(parsed.scaleNote);
  const didacticNote = optionalString(parsed.didacticNote);
  const termsUrl = optionalString(parsed.termsUrl);
  const sourceVersion = optionalString(parsed.sourceVersion);
  const downloadedAt = optionalString(parsed.downloadedAt);
  const downloadUrl = optionalString(parsed.downloadUrl);
  const parameters =
    parsed.parameters && typeof parsed.parameters === "object" && !Array.isArray(parsed.parameters)
      ? (parsed.parameters as Readonly<Record<string, string>>)
      : undefined;
  return {
    label,
    license,
    defaultSourceCrs,
    ...(origin !== undefined ? { origin } : {}),
    ...(transformation !== undefined ? { transformation } : {}),
    ...(scaleNote !== undefined ? { scaleNote } : {}),
    ...(didacticNote !== undefined ? { didacticNote } : {}),
    ...(termsUrl !== undefined ? { termsUrl } : {}),
    ...(sourceVersion !== undefined ? { sourceVersion } : {}),
    ...(downloadedAt !== undefined ? { downloadedAt } : {}),
    ...(downloadUrl !== undefined ? { downloadUrl } : {}),
    ...(parameters !== undefined ? { parameters } : {}),
  };
}

/** Provenance fields that callers may omit when the sidecar left them blank. */
export function optionalProvenanceFields(
  manifest: Pick<FixtureManifest, "origin" | "transformation" | "scaleNote" | "didacticNote">,
): {
  readonly origin?: string;
  readonly transformation?: string;
  readonly scaleNote?: string;
  readonly didacticNote?: string;
} {
  return {
    ...(manifest.origin !== undefined ? { origin: manifest.origin } : {}),
    ...(manifest.transformation !== undefined ? { transformation: manifest.transformation } : {}),
    ...(manifest.scaleNote !== undefined ? { scaleNote: manifest.scaleNote } : {}),
    ...(manifest.didacticNote !== undefined ? { didacticNote: manifest.didacticNote } : {}),
  };
}

function toSummary(fixtureId: string, manifest: FixtureManifest): FixtureCatalogEntry {
  return {
    fixtureId,
    label: manifest.label,
    license: manifest.license,
    defaultSourceCrs: manifest.defaultSourceCrs,
    parameters: manifest.parameters ?? {},
    ...optionalProvenanceFields(manifest),
  };
}

export function listFixtureCatalog(fixturesDirectory: string): readonly FixtureCatalogEntry[] {
  const names = readdirSync(fixturesDirectory)
    .filter((name) => name.endsWith(".geojson"))
    .map((name) => name.slice(0, -".geojson".length))
    .sort((left, right) => left.localeCompare(right));
  return names.map((fixtureId) => toSummary(fixtureId, readManifest(fixturesDirectory, fixtureId)));
}

export function resolveFixturePath(fixturesDirectory: string, fixtureId: string): string {
  return join(fixturesDirectory, `${fixtureId}.geojson`);
}

export function loadFixtureManifest(fixturesDirectory: string, fixtureId: string): FixtureManifest {
  return readManifest(fixturesDirectory, fixtureId);
}
