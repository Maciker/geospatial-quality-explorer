#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { normalizeFinding, writeFindings } from "./lib/findings.mjs";

const args = process.argv.slice(2);
const explicitInput = args[0] && !args[0].startsWith("--") ? args[0] : undefined;
const outIndex = args.indexOf("--out");
const outputPath = outIndex >= 0 ? args[outIndex + 1] : undefined;
const root = process.cwd();

function findDefaultReport() {
  const candidates = [
    ".quality/jscpd/jscpd-report.json",
    ".quality/jscpd/report.json",
    ".quality/jscpd/jscpd.json"
  ];
  return candidates.find((candidate) => fs.existsSync(candidate));
}

const inputPath = explicitInput ?? findDefaultReport();
const report = inputPath && fs.existsSync(inputPath) ? JSON.parse(fs.readFileSync(inputPath, "utf8")) : {};
const duplicates = Array.isArray(report.duplicates) ? report.duplicates : [];
const findings = [];

function fileName(file) {
  if (!file) return "unknown";
  if (typeof file === "string") return file;
  return file.name ?? file.path ?? file.file ?? "unknown";
}

function lineNumber(file) {
  if (!file || typeof file === "string") return undefined;
  return Number.isInteger(file.start) ? file.start : file.startLoc?.line;
}

for (const duplicate of duplicates) {
  const first = duplicate.firstFile ?? duplicate.first ?? duplicate.fileA;
  const second = duplicate.secondFile ?? duplicate.second ?? duplicate.fileB;
  const firstName = fileName(first);
  const secondName = fileName(second);
  const lines = duplicate.lines ?? duplicate.duplication?.lines ?? "unknown";
  const tokens = duplicate.tokens ?? duplicate.duplication?.tokens ?? "unknown";

  findings.push(normalizeFinding({
    tool: "jscpd",
    ruleId: "duplicated-code",
    severity: "warning",
    file: firstName,
    line: lineNumber(first),
    message: `Duplicated code with ${path.normalize(secondName)} (${lines} lines, ${tokens} tokens)`
  }, root));
}

if (outputPath) {
  writeFindings(outputPath, findings, root);
} else {
  console.log(JSON.stringify(findings, null, 2));
}
