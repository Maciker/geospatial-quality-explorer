import type { Finding, ValidationRun } from "../domain/geometry.js";
import { RETENTION_POLICY } from "../domain/limits.js";

export type QualityReport = {
  readonly reportVersion: "1.0.0";
  readonly runId: string;
  readonly dataset: {
    readonly name: string;
    readonly sourceHash: string;
    readonly sourceCrs: string;
    readonly license: string;
    readonly featureCount: number;
  };
  readonly ruleset: { readonly id: string; readonly version: string };
  readonly parameters: Readonly<Record<string, string>>;
  readonly countsBySeverity: { readonly error: number; readonly warning: number; readonly info: number };
  readonly limitations: readonly string[];
  readonly licenseReferences: readonly string[];
  readonly retention: string;
  readonly findings: readonly Finding[];
};

export function buildQualityReport(run: ValidationRun): QualityReport {
  const counts = { error: 0, warning: 0, info: 0 };
  for (const finding of run.findings) counts[finding.severity] += 1;
  return {
    reportVersion: "1.0.0",
    runId: run.runId,
    dataset: {
      name: run.datasetName,
      sourceHash: run.sourceHash,
      sourceCrs: run.sourceCrs,
      license: run.license,
      featureCount: run.featureCount,
    },
    ruleset: { id: run.rulesetId, version: run.rulesetVersion },
    parameters: run.parameters,
    countsBySeverity: counts,
    limitations: [...run.limitations],
    licenseReferences: [run.license],
    retention: RETENTION_POLICY,
    findings: run.findings,
  };
}

export function assertReportRoundTrip(report: QualityReport): void {
  const encoded = JSON.stringify(report.findings);
  const decoded = JSON.parse(encoded) as Finding[];
  if (JSON.stringify(decoded) !== encoded) {
    throw new Error("Finding round-trip changed identifiers, coordinates, or null geometries.");
  }
}
