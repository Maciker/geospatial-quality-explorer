#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { evaluatePostPrReview, POST_PR_REVIEW_STATUSES } from "./post-pr-review-state.mjs";

function value(flag, fallback = null) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1] ?? fallback;
}
function has(flag) { return process.argv.includes(flag); }
function resolvePath(valuePath) { return path.isAbsolute(valuePath) ? valuePath : path.join(process.cwd(), valuePath); }
function fail(message) { console.error(message); process.exit(1); }

const inputPath = value("--input");
if (!inputPath) fail("Usage: pnpm pr:review -- --input <json> [--report <json>] [--require-approved]");
const inputAbsolute = resolvePath(inputPath);
if (!fs.existsSync(inputAbsolute)) fail("Missing post-PR review input: " + inputPath);

let input;
try { input = JSON.parse(fs.readFileSync(inputAbsolute, "utf8")); }
catch (error) { fail("Invalid post-PR review input: " + error.message); }

const reportPath = value("--report", ".ai/workspace/pr-reviews/post-pr-review.json");
const reportAbsolute = resolvePath(reportPath);
const report = { ...evaluatePostPrReview(input), generatedAt: new Date().toISOString(), inputPath };
fs.mkdirSync(path.dirname(reportAbsolute), { recursive: true });
fs.writeFileSync(reportAbsolute, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));

if (!POST_PR_REVIEW_STATUSES.includes(report.status)) fail("Unknown post-PR review status: " + report.status);
if (has("--require-approved") && report.status !== "APPROVED") process.exitCode = 1;
