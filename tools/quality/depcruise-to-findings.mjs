#!/usr/bin/env node
import { normalizeFinding, writeFindings } from "./lib/findings.mjs";
import { readReportArgs } from "../lib/args.mjs";

const { outputPath, root, report } = readReportArgs(".quality/depcruise.json");
const findings = [];

function addFinding(source, dependency, rule, message) {
  findings.push(normalizeFinding({
    tool: "dependency-cruiser",
    ruleId: rule?.name ?? rule?.rule ?? "dependency-rule",
    severity: rule?.severity ?? "error",
    file: source,
    message: message ?? `${source} violates dependency rule for ${dependency ?? "unknown dependency"}`
  }, root));
}

for (const violation of report.summary?.violations ?? []) {
  addFinding(
    violation.from ?? violation.source ?? violation.module ?? "unknown",
    violation.to ?? violation.dependency ?? "unknown",
    { name: violation.rule?.name ?? violation.rule ?? violation.name, severity: violation.severity },
    violation.message
  );
}

for (const moduleEntry of report.modules ?? []) {
  const source = moduleEntry.source ?? moduleEntry.fileName ?? "unknown";
  for (const dependency of moduleEntry.dependencies ?? []) {
    if (dependency.valid !== false && !dependency.rules?.length) continue;
    for (const rule of dependency.rules ?? [{ name: "dependency-rule", severity: "error" }]) {
      addFinding(
        source,
        dependency.resolved ?? dependency.module,
        rule,
        `${source} -> ${dependency.resolved ?? dependency.module ?? "unknown"} violates ${rule.name ?? "dependency rule"}`
      );
    }
  }
}

if (outputPath) {
  writeFindings(outputPath, findings, root);
} else {
  console.log(JSON.stringify(findings, null, 2));
}
