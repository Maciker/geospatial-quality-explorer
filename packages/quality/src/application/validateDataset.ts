import { inspectDataset } from "../domain/inspectDataset.js";
import type { GeometryEngine } from "../domain/GeometryEngine.js";
import type { ValidationRun } from "../domain/geometry.js";
import { NON_WGS84_LIMITATION, QUALITY_LIMITATION, VECTOR_CORE_RULESET } from "../domain/limits.js";
import { canonicalRunMaterial } from "../domain/runMaterial.js";
import { assertDeclaration, parseFeatureCollection, type DatasetDeclaration } from "./parseFeatureCollection.js";

export type Digest = {
  sha256(value: Uint8Array | string): string;
};

export function validateDataset(input: {
  readonly collection: unknown;
  readonly sourceBytes: Uint8Array;
  readonly declaration: DatasetDeclaration;
  readonly digest: Digest;
  readonly engine: GeometryEngine;
  readonly startedAt: Date;
  readonly completedAt: Date;
}): ValidationRun {
  assertDeclaration(input.declaration);
  const features = parseFeatureCollection(input.collection, input.sourceBytes.byteLength);
  const sourceHash = input.digest.sha256(input.sourceBytes);
  const geometryPolicy = input.declaration.sourceCrs === "EPSG:4326" ? "include" : "omit";
  const limitations = [QUALITY_LIMITATION];
  if (geometryPolicy === "omit") limitations.push(NON_WGS84_LIMITATION);
  const runId = input.digest.sha256(canonicalRunMaterial({
    sourceHash,
    rulesetId: VECTOR_CORE_RULESET.id,
    rulesetVersion: VECTOR_CORE_RULESET.version,
    sourceCrs: input.declaration.sourceCrs,
    datasetName: input.declaration.name,
    license: input.declaration.license,
    featureCount: features.length,
    parameters: input.declaration.parameters,
  }));
  return {
    runId,
    datasetName: input.declaration.name,
    sourceHash,
    sourceCrs: input.declaration.sourceCrs,
    license: input.declaration.license,
    featureCount: features.length,
    rulesetId: VECTOR_CORE_RULESET.id,
    rulesetVersion: VECTOR_CORE_RULESET.version,
    parameters: input.declaration.parameters,
    status: "succeeded",
    limitations,
    findings: inspectDataset(features, input.engine, geometryPolicy, runId),
    startedAt: input.startedAt.toISOString(),
    completedAt: input.completedAt.toISOString(),
    failureMessage: null,
  };
}
