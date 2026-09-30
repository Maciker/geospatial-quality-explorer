import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const cli = path.resolve("tools/pr/post-pr-review.mjs");
function base() {
  return {
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
}
function evaluate(input) {
  const dir = mkdtempSync(path.join(tmpdir(), "post-pr-review-"));
  const inputPath = path.join(dir, "input.json");
  const reportPath = path.join(dir, "report.json");
  writeFileSync(inputPath, JSON.stringify(input));
  const result = spawnSync(process.execPath, [cli, "--input", inputPath, "--report", reportPath], { encoding: "utf8" });
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  rmSync(dir, { recursive: true, force: true });
  expect(result.status).toBe(0);
  return report;
}
describe("post-PR review state machine", () => {
  it("approves complete independent evidence", () => {
    expect(evaluate(base()).status).toBe("APPROVED");
  });
  it("keeps pending checks pending", () => {
    const input = base();
    input.checks = { status: "pending", requiredCount: 1, items: [{ name: "quality", required: true, status: "in_progress", conclusion: "unknown" }] };
    expect(evaluate(input).status).toBe("PENDING");
  });
  it("blocks stale SHA evidence", () => {
    const input = base();
    input.current.headSha = "3333333333333333333333333333333333333333";
    expect(evaluate(input).status).toBe("BLOCKED");
  });
  it("requests changes for actionable findings", () => {
    const input = base();
    input.review.findings = [{ severity: "P1", file: "src/example.ts", line: 3, problem: "Missing guard", actionable: true }];
    expect(evaluate(input).status).toBe("CHANGES_REQUESTED");
  });
});

// Keep the repository-native Vitest runner explicit.
