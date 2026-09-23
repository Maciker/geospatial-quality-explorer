#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import { readFindings, summarizeFindings } from "../quality/lib/findings.mjs";
import { ensureDirFor, workspacePath } from "../lib/workspace.mjs";
import { argHelpers } from "../lib/args.mjs";

const root = process.cwd();
const { args, value: argValue } = argHelpers();
const command = args.find((arg) => !arg.startsWith("--")) ?? "run";

function loadConfig() {
  const configPath = path.join(root, "quality/quality.yml");
  if (!fs.existsSync(configPath)) return {};
  return parse(fs.readFileSync(configPath, "utf8")) ?? {};
}

const config = loadConfig();
const qaGate = config.qa_gate ?? {};
const level = argValue("--level", "fast");
const maxIterations = Number(argValue("--max-iterations", qaGate.max_iterations ?? 3));
const verifyCmd = argValue("--verify-cmd", `pnpm quality:${level}`);
const statePath = workspacePath("loop/state.json", root);

const DEFAULT_STATE = { iteration: 0, level, history: [], lastDecision: null, startedAt: null, updatedAt: null };

function readState() {
  if (!fs.existsSync(statePath)) return { ...DEFAULT_STATE };
  try {
    return { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(statePath, "utf8")) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

function writeState(state) {
  ensureDirFor(statePath);
  fs.writeFileSync(statePath, `${JSON.stringify(state, null, 2)}\n`);
}

function collectFindings() {
  const sources = [];
  for (const gate of config.ratchet_gates ?? []) {
    if (gate.current) sources.push({ id: gate.id, file: gate.current });
  }
  if (qaGate.findings) sources.push({ id: "qa-cross-model", file: qaGate.findings });

  const findings = [];
  for (const source of sources) {
    const absolute = path.isAbsolute(source.file) ? source.file : path.join(root, source.file);
    if (!fs.existsSync(absolute)) continue;
    try {
      for (const finding of readFindings(absolute, root)) {
        findings.push({ ...finding, gate: source.id });
      }
    } catch {
      // A malformed findings file is itself a signal the gate did not produce clean output.
    }
  }
  return findings;
}

function readQaReport() {
  const reportPath = qaGate.report ?? ".quality/qa-gate-report.json";
  const absolute = path.isAbsolute(reportPath) ? reportPath : path.join(root, reportPath);
  if (!fs.existsSync(absolute)) return undefined;
  try {
    return JSON.parse(fs.readFileSync(absolute, "utf8"));
  } catch {
    return undefined;
  }
}

function runVerify() {
  console.log(`\n[loop] iteration verify command: ${verifyCmd}`);
  const result = spawnSync(verifyCmd, { cwd: root, stdio: "inherit", shell: true });
  return result.status ?? 1;
}

function decide({ verifyExitCode, errorCount, iteration }) {
  if (verifyExitCode === 0 && errorCount === 0) return "pass";
  if (iteration >= maxIterations) return "stop";
  return "iterate";
}

function writeCorrectionRequest(iteration, findings, qaReport, verifyExitCode) {
  const blocking = findings.filter((finding) => finding.severity === "error");
  const warnings = findings.filter((finding) => finding.severity === "warning");
  const correctionPath = workspacePath(`loop/correction-${String(iteration).padStart(2, "0")}.md`, root);
  ensureDirFor(correctionPath);

  const renderFinding = (finding) => {
    const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
    return `- [${finding.severity}] ${finding.gate ?? finding.tool}/${finding.ruleId} ${location} - ${finding.message}`;
  };

  const lines = [
    `# Correction request (iteration ${iteration} of ${maxIterations})`,
    "",
    `Verify command: \`${verifyCmd}\` (exit code ${verifyExitCode})`,
    "",
    "## Instructions",
    "",
    "- Follow AGENTS.md. Stay in the Red-Green-Refactor cycle.",
    "- Fix the highest severity finding first; do not weaken tests or baselines.",
    "- Change one concern at a time, re-run the loop, and commit on green.",
    "",
    `## Blocking findings (${blocking.length})`,
    "",
    blocking.length ? blocking.map(renderFinding).join("\n") : "_None reported by deterministic gates._",
    "",
    `## Warnings (${warnings.length})`,
    "",
    warnings.length ? warnings.slice(0, 40).map(renderFinding).join("\n") : "_None._",
  ];

  if (qaReport) {
    lines.push(
      "",
      "## Cross-model QA",
      "",
      `Score: ${qaReport.score ?? "n/a"} | Decision: ${qaReport.decision ?? "n/a"} | Critical blocker: ${qaReport.hasCriticalBlocker ?? false}`,
      qaReport.summary ? `\n${qaReport.summary}` : "",
    );
  }

  fs.writeFileSync(correctionPath, `${lines.join("\n")}\n`);
  return correctionPath;
}

function runLoop() {
  const previous = readState();
  const iteration = previous.iteration + 1;
  const startedAt = previous.startedAt ?? new Date().toISOString();

  const verifyExitCode = runVerify();
  const findings = collectFindings();
  const summary = summarizeFindings(findings);
  const qaReport = readQaReport();
  const decision = decide({ verifyExitCode, errorCount: summary.error, iteration });

  let correctionPath;
  if (decision !== "pass") {
    correctionPath = writeCorrectionRequest(iteration, findings, qaReport, verifyExitCode);
  }

  const entry = {
    iteration,
    at: new Date().toISOString(),
    verifyExitCode,
    findings: summary,
    qaDecision: qaReport?.decision ?? null,
    decision,
    correction: correctionPath ? path.relative(root, correctionPath) : null,
  };

  writeState({
    iteration,
    level,
    maxIterations,
    startedAt,
    updatedAt: entry.at,
    lastDecision: decision,
    history: [...previous.history, entry],
  });

  console.log(`\n[loop] ${JSON.stringify(entry, null, 2)}`);

  if (decision === "pass") {
    console.log(`[loop] PASS after ${iteration} iteration(s).`);
    process.exit(0);
  }
  if (decision === "iterate") {
    console.log(`[loop] ITERATE: feed ${entry.correction} to the executor, apply fixes, then run the loop again.`);
    process.exit(2);
  }
  console.error(`[loop] STOP: max iterations (${maxIterations}) reached without passing. Escalate to a human.`);
  process.exit(1);
}

if (command === "reset") {
  writeState({ ...DEFAULT_STATE });
  console.log("[loop] state reset");
} else if (command === "status") {
  console.log(JSON.stringify(readState(), null, 2));
} else if (command === "run") {
  runLoop();
} else {
  console.log("Usage: node tools/loop/verify-and-iterate.mjs <run|status|reset> [--level fast|full|agent] [--verify-cmd <cmd>] [--max-iterations N]");
}
