#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { argHelpers } from "../lib/args.mjs";

const root = process.cwd();
const { valueLoose: argValue, flag: hasFlag } = argHelpers();

const base = argValue("--base", "origin/main");
const head = argValue("--head", "HEAD");
const out = argValue("--out", ".ai/workspace/qa/inputs/qa-input.md");
const prd = argValue("--prd", undefined);
const plan = argValue("--plan", undefined);
const summary = argValue("--summary", undefined);
const review = argValue("--review", undefined);

function readOptional(filePath) {
  if (!filePath) return "";
  const absolute = path.isAbsolute(filePath) ? filePath : path.join(root, filePath);
  if (!fs.existsSync(absolute)) return `Missing file: ${filePath}\n`;
  return fs.readFileSync(absolute, "utf8");
}

function runGit(argsForGit, fallback) {
  try {
    return execFileSync("git", argsForGit, { cwd: root, encoding: "utf8", maxBuffer: 50 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  } catch (error) {
    return fallback ?? `git ${argsForGit.join(" ")} failed: ${error.message}\n`;
  }
}

function section(title, body) {
  const content = String(body ?? "").trim();
  if (!content) return "";
  return `\n## ${title}\n\n${content}\n`;
}

const prompt = readOptional(".ai/prompts/qa-cross-model.md");
const agents = readOptional("AGENTS.md");
const qualityReport = readOptional(".quality/ratchet-report.json");
const status = runGit(["status", "--short"], "Git status unavailable.\n");
const changedFiles = runGit(["diff", "--name-status", `${base}...${head}`], "Changed files unavailable.\n");
const diff = runGit(["diff", "--no-ext-diff", "--unified=80", `${base}...${head}`], "Diff unavailable. Make sure the base ref exists locally.\n");
const commits = runGit(["log", "--oneline", `${base}..${head}`], "Commit list unavailable.\n");

const output = `# Cross-model QA input

Generated at: ${new Date().toISOString()}
Base ref: \`${base}\`
Head ref: \`${head}\`

${section("QA reviewer instructions", prompt)}
${section("Repository guardrails", agents)}
${section("PRD", readOptional(prd))}
${section("Approved plan", readOptional(plan))}
${section("Execution summary", readOptional(summary))}
${section("Previous review", readOptional(review))}
${section("Git status", `\`\`\`text\n${status.trim()}\n\`\`\``)}
${section("Commits", `\`\`\`text\n${commits.trim()}\n\`\`\``)}
${section("Changed files", `\`\`\`text\n${changedFiles.trim()}\n\`\`\``)}
${section("Ratchet report", qualityReport ? `\`\`\`json\n${qualityReport.trim()}\n\`\`\`` : "No ratchet report found.")}
${section("Diff", `\`\`\`diff\n${diff.trim()}\n\`\`\``)}

Return JSON only, using the schema in the instructions above.
`;

const absoluteOut = path.isAbsolute(out) ? out : path.join(root, out);
fs.mkdirSync(path.dirname(absoluteOut), { recursive: true });
fs.writeFileSync(absoluteOut, output);

if (!hasFlag("--quiet")) {
  console.log(`QA input written to ${path.relative(root, absoluteOut)}`);
  console.log("Send this file to a different model than the implementer, then save the JSON response to .ai/workspace/qa/outputs/qa-review.json");
}
