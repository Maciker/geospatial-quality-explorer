#!/usr/bin/env node
import fs from "node:fs";
import { normalizeFinding, writeFindings } from "./lib/findings.mjs";

const args = process.argv.slice(2);
const inputPath = args[0] && !args[0].startsWith("--") ? args[0] : ".quality/eslint.json";
const outIndex = args.indexOf("--out");
const outputPath = outIndex >= 0 ? args[outIndex + 1] : undefined;
const root = process.cwd();

const report = fs.existsSync(inputPath) ? JSON.parse(fs.readFileSync(inputPath, "utf8")) : [];
const findings = [];

for (const fileReport of report) {
  for (const message of fileReport.messages ?? []) {
    findings.push(normalizeFinding({
      tool: "eslint",
      ruleId: message.ruleId ?? "unknown",
      severity: message.severity,
      file: fileReport.filePath,
      line: message.line,
      column: message.column,
      message: message.message
    }, root));
  }
}

if (outputPath) {
  writeFindings(outputPath, findings, root);
} else {
  console.log(JSON.stringify(findings, null, 2));
}
