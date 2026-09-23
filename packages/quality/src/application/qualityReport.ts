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

export function runFromReport(report: QualityReport): ValidationRun {
  return {
    runId: report.runId,
    datasetName: report.dataset.name,
    sourceHash: report.dataset.sourceHash,
    sourceCrs: report.dataset.sourceCrs,
    license: report.dataset.license,
    featureCount: report.dataset.featureCount,
    rulesetId: report.ruleset.id,
    rulesetVersion: report.ruleset.version,
    parameters: report.parameters,
    status: "succeeded",
    limitations: report.limitations,
    findings: report.findings,
    startedAt: "1970-01-01T00:00:00.000Z",
    completedAt: "1970-01-01T00:00:00.000Z",
    failureMessage: null,
  };
}

export function conciseReport(run: ValidationRun): string {
  const lines = [
    `Run ${run.runId}`,
    `Ruleset ${run.rulesetId}@${run.rulesetVersion}`,
    `Source ${run.sourceHash}`,
    `CRS ${run.sourceCrs}`,
    `Findings: ${run.findings.length}`,
  ];
  for (const finding of run.findings) {
    lines.push(`- [${finding.severity}] ${finding.ruleId} ${finding.featureId}: ${finding.explanation}`);
  }
  if (run.findings.length === 0) lines.push("No findings.");
  return `${lines.join("\n")}\n`;
}

export function assertReportRoundTrip(report: QualityReport): void {
  const encoded = JSON.stringify(report.findings);
  const decoded = JSON.parse(encoded) as Finding[];
  if (JSON.stringify(decoded) !== encoded) {
    throw new Error("Finding round-trip changed identifiers, coordinates, or null geometries.");
  }
}
