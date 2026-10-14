#!/usr/bin/env node
import fs from "node:fs";
import { normalizeFinding, writeFindings, writeJson } from "../quality/lib/findings.mjs";
import { argHelpers } from "../lib/args.mjs";

const { args, valueLoose: argValue, flag: hasFlag } = argHelpers();
const inputPath = args[0] && !args[0].startsWith("--") ? args[0] : ".ai/workspace/qa/outputs/qa-review.json";

const optional = hasFlag("--optional") || process.env.QA_GATE_OPTIONAL === "1";
const passScore = Number(argValue("--pass-score", process.env.QA_PASS_SCORE ?? "80"));
const retryScoreMin = Number(argValue("--retry-score-min", process.env.QA_RETRY_SCORE_MIN ?? "60"));
const findingsPath = argValue("--write-findings", ".quality/qa-findings.json");
const reportPath = argValue("--write-report", ".quality/qa-gate-report.json");
const root = process.cwd();

function fail(message) {
  throw new Error(message);
}

function validateReview(review) {
  if (!review || typeof review !== "object" || Array.isArray(review)) fail("QA review must be an object");
  if (!Number.isInteger(review.score) || review.score < 0 || review.score > 100) fail("QA score must be an integer from 0 to 100");
  if (!["pass", "iterate", "stop"].includes(review.decision)) fail("QA decision must be pass, iterate or stop");
  if (typeof review.summary !== "string" || review.summary.trim() === "") fail("QA summary is required");
  for (const key of ["blocking_findings", "missing_tests", "non_blocking_findings"]) {
    if (!Array.isArray(review[key])) fail(`QA ${key} must be an array`);
  }
  if (!["low", "medium", "high"].includes(review.confidence)) fail("QA confidence must be low, medium or high");
  return review;
}

function qaSeverityToFindingSeverity(qaSeverity, blocking) {
  if (qaSeverity === "P0" || qaSeverity === "P1") return "error";
  if (blocking) return "error";
  if (qaSeverity === "P2") return "warning";
  return "info";
}

function findingFromQa(raw, blocking) {
  const qaSeverity = raw.severity ?? (blocking ? "P1" : "P3");
  return normalizeFinding({
    tool: "qa-cross-model",
    ruleId: qaSeverity,
    severity: qaSeverityToFindingSeverity(qaSeverity, blocking),
    file: raw.file ?? "unknown",
    line: raw.line,
    message: raw.problem ?? raw.message ?? "QA finding",
    fingerprint: raw.fingerprint
  }, root);
}

function emptyPass(reason) {
  const report = {
    generatedAt: new Date().toISOString(),
    required: !optional,
    passed: true,
    skipped: true,
    reason,
    score: null,
    decision: "skipped",
    blockingCount: 0,
    missingTestsCount: 0,
    nonBlockingCount: 0
  };
  writeFindings(findingsPath, [], root);
  writeJson(reportPath, report);
  console.log(reason);
}

try {
  if (!fs.existsSync(inputPath)) {
    if (optional) {
      emptyPass(`QA review not found at ${inputPath}; optional gate skipped`);
      process.exit(0);
    }
    fail(`Missing QA review file: ${inputPath}. Run pnpm qa:prepare, get a cross-model review, then save it there.`);
  }

  const review = validateReview(JSON.parse(fs.readFileSync(inputPath, "utf8")));
  const blockingFindings = review.blocking_findings.map((finding) => findingFromQa(finding, true));
  const nonBlockingFindings = review.non_blocking_findings.map((finding) => findingFromQa(finding, false));
  const missingTestFindings = review.missing_tests.map((message) => normalizeFinding({
    tool: "qa-cross-model",
    ruleId: "missing-test",
    severity: "warning",
    file: "tests",
    message: String(message),
    fingerprint: undefined
  }, root));

  const allFindings = [...blockingFindings, ...missingTestFindings, ...nonBlockingFindings];
  writeFindings(findingsPath, allFindings, root);

  const hasCriticalBlocker = review.blocking_findings.some((finding) => ["P0", "P1"].includes(finding.severity));
  // Any entry in blocking_findings blocks, whatever its severity; non-blocking issues belong in non_blocking_findings.
  const hasBlocker = review.blocking_findings.length > 0;
  const passed = review.score >= passScore && review.decision === "pass" && !hasBlocker;
  const report = {
    generatedAt: new Date().toISOString(),
    required: !optional,
    passed,
    skipped: false,
    score: review.score,
    decision: review.decision,
    confidence: review.confidence,
    passScore,
    retryScoreMin,
    blockingCount: review.blocking_findings.length,
    missingTestsCount: review.missing_tests.length,
    nonBlockingCount: review.non_blocking_findings.length,
    hasCriticalBlocker,
    summary: review.summary
  };
  writeJson(reportPath, report);

  console.log(JSON.stringify(report, null, 2));

  if (!passed) {
    const action = review.score < retryScoreMin || review.decision === "stop" ? "stop" : "iterate";
    fail(`QA gate failed: ${action}. Score=${review.score}, decision=${review.decision}, blockingFindings=${review.blocking_findings.length}, criticalBlocker=${hasCriticalBlocker}`);
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
