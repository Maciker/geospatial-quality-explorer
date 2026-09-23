#!/usr/bin/env node
import { normalizeFinding, writeFindings } from "./lib/findings.mjs";
import { readReportArgs } from "../lib/args.mjs";

const { outputPath, root, report } = readReportArgs(".ai/workspace/qa/outputs/qa-review.json");
const findings = [];

function severityFromQa(qaSeverity, blocking) {
  if (qaSeverity === "P0" || qaSeverity === "P1") return "error";
  if (blocking) return "error";
  if (qaSeverity === "P2") return "warning";
  return "info";
}

function addFinding(finding, blocking) {
  const qaSeverity = finding.severity ?? (blocking ? "P1" : "P3");
  findings.push(normalizeFinding({
    tool: "qa-cross-model",
    ruleId: qaSeverity,
    severity: severityFromQa(qaSeverity, blocking),
    file: finding.file ?? "unknown",
    line: finding.line,
    message: finding.problem ?? finding.message ?? finding.why_it_matters ?? "QA finding"
  }, root));
}

for (const finding of report.blocking_findings ?? report.blockingFindings ?? []) {
  addFinding(finding, true);
}

for (const finding of report.non_blocking_findings ?? report.nonBlockingFindings ?? []) {
  addFinding(finding, false);
}

for (const missingTest of report.missing_tests ?? report.missingTests ?? []) {
  findings.push(normalizeFinding({
    tool: "qa-cross-model",
    ruleId: "missing-test",
    severity: "warning",
    file: "tests",
    message: String(missingTest)
  }, root));
}

if (outputPath) {
  writeFindings(outputPath, findings, root);
} else {
  console.log(JSON.stringify(findings, null, 2));
}
