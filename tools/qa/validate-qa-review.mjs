#!/usr/bin/env node
import fs from "node:fs";

const inputPath = process.argv[2] ?? ".ai/workspace/qa/outputs/qa-review.json";

function fail(message) {
  throw new Error(message);
}

function expectObject(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${path} must be an object`);
}

function expectString(value, path) {
  if (typeof value !== "string" || value.trim().length === 0) fail(`${path} must be a non-empty string`);
}

function expectEnum(value, allowed, path) {
  if (!allowed.includes(value)) fail(`${path} must be one of: ${allowed.join(", ")}`);
}

function expectArray(value, path) {
  if (!Array.isArray(value)) fail(`${path} must be an array`);
}

function validateFinding(finding, path) {
  expectObject(finding, path);
  expectEnum(finding.severity, ["P0", "P1", "P2", "P3"], `${path}.severity`);
  expectString(finding.file, `${path}.file`);
  if (finding.line !== undefined && (!Number.isInteger(finding.line) || finding.line < 1)) {
    fail(`${path}.line must be a positive integer when present`);
  }
  expectString(finding.problem, `${path}.problem`);
  expectString(finding.why_it_matters, `${path}.why_it_matters`);
  expectString(finding.suggested_fix, `${path}.suggested_fix`);
  if (finding.confidence !== undefined) {
    expectEnum(finding.confidence, ["low", "medium", "high"], `${path}.confidence`);
  }
}

function validateReview(review) {
  expectObject(review, "review");
  if (!Number.isInteger(review.score) || review.score < 0 || review.score > 100) {
    fail("review.score must be an integer from 0 to 100");
  }
  expectEnum(review.decision, ["pass", "iterate", "stop"], "review.decision");
  expectString(review.summary, "review.summary");
  expectArray(review.blocking_findings, "review.blocking_findings");
  expectArray(review.missing_tests, "review.missing_tests");
  expectArray(review.non_blocking_findings, "review.non_blocking_findings");
  expectEnum(review.confidence, ["low", "medium", "high"], "review.confidence");

  review.blocking_findings.forEach((finding, index) => validateFinding(finding, `review.blocking_findings[${index}]`));
  review.non_blocking_findings.forEach((finding, index) => validateFinding(finding, `review.non_blocking_findings[${index}]`));
  review.missing_tests.forEach((test, index) => expectString(test, `review.missing_tests[${index}]`));

  return review;
}

if (!fs.existsSync(inputPath)) {
  fail(`Missing QA review file: ${inputPath}`);
}

const review = validateReview(JSON.parse(fs.readFileSync(inputPath, "utf8")));
console.log(JSON.stringify({ valid: true, score: review.score, decision: review.decision }, null, 2));
