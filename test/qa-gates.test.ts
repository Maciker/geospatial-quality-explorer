import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const repositories: string[] = [];
afterEach(() => {
  for (const directory of repositories.splice(0)) rmSync(directory, { recursive: true, force: true });
});

type Finding = { severity: string; file: string; problem: string; why_it_matters: string; suggested_fix: string };

function review(overrides: { blocking_findings?: Finding[] } = {}) {
  return {
    score: 95,
    decision: "pass",
    summary: "Reviewed the exact diff.",
    blocking_findings: [],
    missing_tests: [],
    non_blocking_findings: [],
    confidence: "high",
    ...overrides,
  };
}

function git(cwd: string, args: string[]) {
  execFileSync("git", ["-c", "user.email=qa@example.test", "-c", "user.name=qa", ...args], { cwd, stdio: "pipe" });
}

function repositoryWithOneChange() {
  const directory = mkdtempSync(path.join(tmpdir(), "qa-gates-"));
  repositories.push(directory);
  cpSync("tools", path.join(directory, "tools"), { recursive: true });
  mkdirSync(path.join(directory, ".ai/prompts"), { recursive: true });
  cpSync(".ai/prompts/qa-cross-model.md", path.join(directory, ".ai/prompts/qa-cross-model.md"));
  writeFileSync(path.join(directory, ".gitignore"), ".ai/workspace/\n.quality/\n");
  writeFileSync(path.join(directory, "feature.ts"), "export const answer = 1;\n");
  git(directory, ["init", "-q"]);
  git(directory, ["add", "-A"]);
  git(directory, ["commit", "-qm", "base"]);
  writeFileSync(path.join(directory, "feature.ts"), "export const answer = 2;\n");
  git(directory, ["commit", "-qam", "change"]);
  return directory;
}

function node(cwd: string, script: string, args: string[] = []) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: "utf8" });
}

function preparedRepository(qaReview: object) {
  const directory = repositoryWithOneChange();
  expect(node(directory, "tools/qa/prepare-qa-input.mjs", ["--base", "HEAD~1", "--head", "HEAD", "--quiet"]).status).toBe(0);
  mkdirSync(path.join(directory, ".ai/workspace/qa/outputs"), { recursive: true });
  writeFileSync(path.join(directory, ".ai/workspace/qa/outputs/qa-review.json"), JSON.stringify(qaReview));
  return directory;
}

function record(directory: string, reviewer: [string, string], implementer: [string, string]) {
  return node(directory, "tools/qa/record-qa-run.mjs", [
    "--reviewer-provider", reviewer[0], "--reviewer-model", reviewer[1],
    "--implementer-provider", implementer[0], "--implementer-model", implementer[1],
  ]);
}

describe("pre-PR gate", () => {
  it("passes a clean review from a different model and reports the identities as declared", () => {
    const directory = preparedRepository(review());

    expect(record(directory, ["qwen", "qwen-coder"], ["openai", "gpt-x"]).status).toBe(0);
    const gate = node(directory, "tools/qa/pre-pr-gate.mjs");

    expect(gate.status).toBe(0);
    expect(gate.stdout).toContain('"identityEvidence": "declared"');
  });

  it("treats identities that differ only by letter case as the same model", () => {
    const directory = preparedRepository(review());

    const recorded = record(directory, ["OpenAI", "GPT-X"], ["openai", "gpt-x"]);

    expect(recorded.status).not.toBe(0);
    expect(node(directory, "tools/qa/pre-pr-gate.mjs").status).not.toBe(0);
  });

  it("requires a provider for both reviewer and implementer", () => {
    const directory = preparedRepository(review());

    const recorded = node(directory, "tools/qa/record-qa-run.mjs", ["--reviewer-model", "gpt-x", "--implementer-model", "other"]);

    expect(recorded.status).not.toBe(0);
  });

  it("rejects declared evidence when harness evidence is required", () => {
    const directory = preparedRepository(review());
    record(directory, ["qwen", "qwen-coder"], ["openai", "gpt-x"]);

    const gate = node(directory, "tools/qa/pre-pr-gate.mjs", ["--require-harness"]);

    expect(gate.status).not.toBe(0);
  });

  it("blocks a passing review that still lists a low-severity blocking finding", () => {
    const blocker = { severity: "P2", file: "feature.ts", problem: "p", why_it_matters: "w", suggested_fix: "f" };
    const directory = preparedRepository(review({ blocking_findings: [blocker] }));
    record(directory, ["qwen", "qwen-coder"], ["openai", "gpt-x"]);

    const gate = node(directory, "tools/qa/pre-pr-gate.mjs");

    expect(gate.status).not.toBe(0);
    const report = JSON.parse(readFileSync(path.join(directory, ".quality/qa-gate-report.json"), "utf8"));
    expect(report.passed).toBe(false);
  });

  it("invalidates the review when HEAD moves after QA", () => {
    const directory = preparedRepository(review());
    record(directory, ["qwen", "qwen-coder"], ["openai", "gpt-x"]);
    writeFileSync(path.join(directory, "feature.ts"), "export const answer = 3;\n");
    git(directory, ["commit", "-qam", "late change"]);

    const gate = node(directory, "tools/qa/pre-pr-gate.mjs");

    expect(gate.status).not.toBe(0);
    expect(gate.stderr).toContain("HEAD changed");
  });
});
