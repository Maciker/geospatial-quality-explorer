import { afterEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

type ReviewInput = {
  pr: { number: number; url: string; baseSha: string; headSha: string };
  current: { baseSha: string; headSha: string };
  diff: { complete: boolean; baseSha: string; headSha: string; files: string[]; digest: string };
  checks: { status: string; requiredCount: number; items: Array<{ name: string; required: boolean; status: string; conclusion: string; url?: string }> };
  review: { decision: string; reviewer: Record<string, unknown>; implementer: Record<string, unknown>; findings: Array<Record<string, unknown>>; missing_tests: string[]; [key: string]: unknown };
  publication?: { status: string; url: string; tool: string };
  [key: string]: unknown;
};
const temporaryDirectories: string[] = [];
afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

function baseInput(): ReviewInput {
  return {
    pr: { number: 42, url: "https://example.test/pr/42", baseSha: "1111111111111111111111111111111111111111", headSha: "2222222222222222222222222222222222222222" },
    current: { baseSha: "1111111111111111111111111111111111111111", headSha: "2222222222222222222222222222222222222222" },
    diff: { complete: true, baseSha: "1111111111111111111111111111111111111111", headSha: "2222222222222222222222222222222222222222", files: ["src/example.ts"], digest: "sha256:diff" },
    checks: { status: "complete", requiredCount: 1, items: [{ name: "quality", required: true, status: "completed", conclusion: "success", url: "https://example.test/check" }] },
    comments: [{ id: 1, author: "maintainer", createdAt: "2026-09-30T00:00:00Z", url: "https://example.test/comment/1" }],
    reviews: [],
    review: {
      decision: "pass",
      summary: "No blocking findings.",
      reviewer: { identity: "cursor:composer-2.5", provider: "cursor", model: "composer-2.5", verified: true, independent: true },
      implementer: { identity: "cursor:grok-4.7", provider: "cursor", model: "grok-4.7", verified: true },
      findings: [],
      missing_tests: [],
    },
    publication: { status: "published", url: "https://example.test/comment/42", tool: "pr-comment" },
  };
}
function run(input: ReviewInput) {
  const directory = mkdtempSync(path.join(tmpdir(), "post-pr-review-"));
  temporaryDirectories.push(directory);
  const inputPath = path.join(directory, "input.json");
  const reportPath = path.join(directory, "report.json");
  writeFileSync(inputPath, JSON.stringify(input));
  const result = spawnSync(process.execPath, ["tools/pr/post-pr-review.mjs", "--input", inputPath, "--report", reportPath], { cwd: process.cwd(), encoding: "utf8" });
  const report = JSON.parse(readFileSync(reportPath, "utf8"));
  return { result, report };
}

describe("post-PR review state machine", () => {
  it("approves only with complete evidence, independent identities and successful checks", () => {
    expect(run(baseInput()).report.status).toBe("APPROVED");
  });
  it("stays pending while required checks are still running", () => {
    const input = baseInput();
    input.checks = { status: "pending", requiredCount: 1, items: [{ name: "quality", required: true, status: "in_progress", conclusion: "unknown" }] };
    expect(run(input).report.status).toBe("PENDING");
  });
  it("blocks stale evidence when the PR head SHA changes", () => {
    const input = baseInput();
    input.current = { baseSha: input.pr.baseSha, headSha: "3333333333333333333333333333333333333333" };
    const result = run(input);
    expect(result.report.status).toBe("BLOCKED");
    expect(result.report.reasons).toContain("sha_changed_or_stale_evidence");
  });
  it("blocks when reviewer identity or publication evidence is absent", () => {
    const input = baseInput();
    input.review.reviewer = { identity: "cursor:composer-2.5", verified: false, independent: false };
    expect(run(input).report.status).toBe("BLOCKED");
    const unpublished = baseInput();
    delete unpublished.publication;
    expect(run(unpublished).report.status).toBe("PENDING");
  });
  it("blocks when required checks failed", () => {
    const input = baseInput();
    input.checks = { status: "failed", requiredCount: 1, items: [{ name: "quality", required: true, status: "completed", conclusion: "failure" }] };

    const result = run(input);

    expect(result.report.status).toBe("BLOCKED");
    expect(result.report.reasons).toContain("required_check_failed");
  });
  it("blocks a complete check status that lists no required check", () => {
    const input = baseInput();
    input.checks = { status: "complete", requiredCount: 0, items: [] };

    expect(run(input).report.reasons).toContain("required_check_evidence_missing");
  });
  it("requests changes for any blocking finding, including P3", () => {
    const input = baseInput();
    input.review.blocking_findings = [{ severity: "P3", file: "src/example.ts", problem: "Must fix before merge" }];

    expect(run(input).report.status).toBe("CHANGES_REQUESTED");
  });
  it("evaluates the documented example input as pending until the review is published", () => {
    const example = JSON.parse(readFileSync("examples/post-pr-review/input.example.json", "utf8")) as ReviewInput;

    const result = run(example);

    expect(result.report.status).toBe("PENDING");
    expect(result.report.reasons).toContain("review_evidence_not_published");
  });
  it("requests changes, then approves the corrected head after a fresh review", () => {
    const input = baseInput();
    input.review = { ...input.review, decision: "iterate", findings: [{ severity: "P1", file: "src/example.ts", line: 3, problem: "Missing guard", whyItMatters: "Invalid input fails", suggestedFix: "Add validation" }] };
    expect(run(input).report.status).toBe("CHANGES_REQUESTED");
    const corrected = baseInput();
    corrected.pr.headSha = "3333333333333333333333333333333333333333";
    corrected.current.headSha = corrected.pr.headSha;
    corrected.diff.headSha = corrected.pr.headSha;
    expect(run(corrected).report.status).toBe("APPROVED");
  });
});
