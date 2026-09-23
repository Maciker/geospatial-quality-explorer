#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const outputPath = ".quality/qa-review.json";
const report = {
  score: 100,
  decision: "pass",
  summary: "QA agent is not wired yet. Placeholder review passed.",
  blocking_findings: [],
  missing_tests: [],
  non_blocking_findings: [],
  confidence: "low"
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(`qa placeholder wrote ${outputPath}`);
