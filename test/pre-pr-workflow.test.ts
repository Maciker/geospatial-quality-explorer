import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const prePrCommand = readFileSync(".ai/commands/pre-pr.md", "utf8");
const cursorRule = readFileSync(".cursor/rules/00-agent-workflow.mdc", "utf8");

describe("pre-PR workflow", () => {
  it("exposes a strict gate and records model evidence", () => {
    expect(packageJson.scripts["prepr:gate"]).toBe("node tools/qa/pre-pr-gate.mjs");
    expect(packageJson.scripts["qa:record"]).toBe("node tools/qa/record-qa-run.mjs");
    expect(prePrCommand).toContain("qa-cross-model");
    expect(prePrCommand).toContain("pnpm prepr:gate");
    expect(prePrCommand).toContain("at most two rounds");
  });

  it("teaches Cursor to run the gate before PR creation", () => {
    expect(cursorRule).toContain("pre-PR gate");
    expect(cursorRule).toContain("qa-cross-model");
    expect(cursorRule).toContain("Do not open a PR");
  });
});
