import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { ALEXA_TOOL_LIMITS } from "../domain/sessionLimits.js";
import {
  listFixtureCatalog,
  loadFixtureManifest,
  optionalProvenanceFields,
  resolveFixturePath,
} from "./listFixtureCatalog.js";

export type FixtureSourceResponse = {
  readonly fixtureId: string;
  readonly label: string;
  readonly license: string;
  readonly sourceCrs: string;
  readonly sourceHash: string;
  readonly origin?: string;
  readonly transformation?: string;
  readonly scaleNote?: string;
  readonly didacticNote?: string;
  readonly collection: {
    readonly type: "FeatureCollection";
    readonly features: readonly unknown[];
  };
};

export function readFixtureSource(
  fixturesDirectory: string,
  fixtureId: string,
): FixtureSourceResponse | { readonly error: "not_found" | "invalid_request"; readonly message: string } {
  if (!ALEXA_TOOL_LIMITS.fixtureIdPattern.test(fixtureId)) {
    return { error: "invalid_request", message: `Invalid fixture id ${fixtureId}.` };
  }
  const catalog = listFixtureCatalog(fixturesDirectory);
  if (!catalog.some((entry) => entry.fixtureId === fixtureId)) {
    return { error: "not_found", message: `Unknown fixture ${fixtureId}.` };
  }
  const path = resolveFixturePath(fixturesDirectory, fixtureId);
  const sourceBytes = readFileSync(path);
  if (sourceBytes.byteLength > ALEXA_TOOL_LIMITS.maxBytes) {
    return { error: "invalid_request", message: `Fixtures are limited to ${ALEXA_TOOL_LIMITS.maxBytes} bytes.` };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(sourceBytes.toString("utf8")) as unknown;
  } catch {
    return { error: "invalid_request", message: "The fixture file is not valid JSON." };
  }
  if (
    typeof parsed !== "object"
    || parsed === null
    || (parsed as { type?: string }).type !== "FeatureCollection"
    || !Array.isArray((parsed as { features?: unknown }).features)
  ) {
    return { error: "invalid_request", message: "Fixture must be a FeatureCollection." };
  }
  const manifest = loadFixtureManifest(fixturesDirectory, fixtureId);
  const sourceHash = createHash("sha256").update(sourceBytes).digest("hex");
  return {
    fixtureId,
    label: manifest.label,
    license: manifest.license,
    sourceCrs: manifest.defaultSourceCrs,
    sourceHash,
    ...optionalProvenanceFields(manifest),
    collection: {
      type: "FeatureCollection",
      features: (parsed as { features: unknown[] }).features,
    },
  };
}
