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

function readManifest(fixturesDirectory: string, fixtureId: string): FixtureManifest {
  const path = join(fixturesDirectory, `${fixtureId}.fixture.json`);
  if (!existsSync(path)) {
    throw new Error(`Missing fixture metadata sidecar ${fixtureId}.fixture.json`);
  }
  const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<FixtureManifest>;
  if (typeof parsed.label !== "string" || parsed.label.trim() === "") {
    throw new Error(`${fixtureId}.fixture.json must declare a non-empty label`);
  }
  if (typeof parsed.license !== "string" || parsed.license.trim() === "") {
    throw new Error(`${fixtureId}.fixture.json must declare a license`);
  }
  if (typeof parsed.defaultSourceCrs !== "string" || !/^EPSG:\d+$/.test(parsed.defaultSourceCrs)) {
    throw new Error(`${fixtureId}.fixture.json must declare defaultSourceCrs as EPSG:####`);
  }
  return {
    label: parsed.label,
    license: parsed.license,
    defaultSourceCrs: parsed.defaultSourceCrs,
    origin: parsed.origin,
    transformation: parsed.transformation,
    scaleNote: parsed.scaleNote,
    didacticNote: parsed.didacticNote,
    termsUrl: parsed.termsUrl,
    sourceVersion: parsed.sourceVersion,
    downloadedAt: parsed.downloadedAt,
    downloadUrl: parsed.downloadUrl,
    parameters: parsed.parameters,
  };
}

function toSummary(fixtureId: string, manifest: FixtureManifest): FixtureCatalogEntry {
  return {
    fixtureId,
    label: manifest.label,
    license: manifest.license,
    defaultSourceCrs: manifest.defaultSourceCrs,
    origin: manifest.origin,
    transformation: manifest.transformation,
    scaleNote: manifest.scaleNote,
    didacticNote: manifest.didacticNote,
    parameters: manifest.parameters ?? {},
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
