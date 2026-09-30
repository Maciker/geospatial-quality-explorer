import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const cli = path.resolve("tools/pr/post-pr-review.mjs");
const base = {
  pr: { number: 7, url: "https://example.test/pr/7", baseSha: "1111111111111111111111111111111111111111", headSha: "2222222222222222222222222222222222222222" },
  current: { baseSha: "1111111111111111111111111111111111111111", headSha: "2222222222222222222222222222222222222222" },
  diff: { complete: true, baseSha: "1111111111111111111111111111111111111111", headSha: "2222222222222222222222222222222222222222", files: ["src/example.ts"], digest: "sha256:diff" },
  checks: { status: "complete", requiredCount: 1, items: [{ name: "quality", required: true, status: "completed", conclusion: "success" }] },
  comments: [], reviews: [],
  review: {
    decision: "pass",
    reviewer: { identity: "reviewer:independent", provider: "verified", model: "independent", verified: true, independent: true },
    implementer: { identity: "implementer:agent", provider: "verified", model: "implementer", verified: true },
    findings: [], missing_tests: []
  },
  publication: { status: "published", url: "https://example.test/review/7", tool: "pr-comment" }
};
function evaluate(input) {
  const dir = mkdtempSync(path.join(tmpdir(), "post-pr-review-"));
  const inputPath = path.join(dir, "input.json"), reportPath = path.join(dir, "report.json");
  writeFileSync(inputPath, JSON.stringify(input));
  const result = spawnSync(process.execPath, [cli, "--input", inputPath, "--report", reportPath], { encoding: "utf8" });
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  rmSync(dir, { recursive: true, force: true });
  assert.equal(result.status, 0);
  return report;
}
test("approves complete independent evidence", () => assert.equal(evaluate(base).status, "APPROVED"));
test("keeps pending checks pending", () => {
  const input = structuredClone(base);
  input.checks = { status: "pending", requiredCount: 1, items: [{ name: "quality", required: true, status: "in_progress", conclusion: "unknown" }] };
  assert.equal(evaluate(input).status, "PENDING");
});
test("blocks stale SHA evidence", () => {
  const input = structuredClone(base);
  input.current.headSha = "3333333333333333333333333333333333333333";
  assert.equal(evaluate(input).status, "BLOCKED");
});
