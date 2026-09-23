#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parse } from "yaml";
import {
  compareFindings,
  readFindings,
  readJson,
  summarizeFindings,
  writeFindings,
  writeJson
} from "./lib/findings.mjs";

const root = process.cwd();
const configPath = path.join(root, "quality/quality.yml");
const command = process.argv[2] ?? "help";

function loadConfig() {
  if (!fs.existsSync(configPath)) {
    throw new Error("Missing quality/quality.yml");
  }
  return parse(fs.readFileSync(configPath, "utf8"));
}

function runShell(label, cmd) {
  console.log(`\n$ ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: root, shell: true });
  } catch (error) {
    throw new Error(`${label} failed with exit code ${error.status ?? "unknown"}`, { cause: error });
  }
}

function runCollect(config) {
  for (const gate of config.ratchet_gates ?? []) {
    if (gate.collect) {
      runShell(`${gate.id}:collect`, gate.collect);
    }
    if (gate.parse) {
      runShell(`${gate.id}:parse`, gate.parse);
    }
    if (!gate.current || !fs.existsSync(path.join(root, gate.current))) {
      writeFindings(path.join(root, gate.current), [], root);
    }
  }
}

function compareGate(gate, mode) {
  const currentPath = path.join(root, gate.current);
  const baselinePath = path.join(root, gate.baseline);
  const current = readFindings(currentPath, root);
  const baseline = readFindings(baselinePath, root);

  if (mode === "init") {
    writeFindings(baselinePath, current, root);
    return {
      id: gate.id,
      current: current.length,
      baseline: current.length,
      newCount: 0,
      fixedCount: 0,
      failed: false
    };
  }

  const { newFindings, remainingBaseline, fixedFindings } = compareFindings(current, baseline);

  if (fixedFindings.length > 0) {
    writeFindings(baselinePath, remainingBaseline, root);
  }

  return {
    id: gate.id,
    current: current.length,
    baseline: baseline.length,
    newFindings,
    fixedFindings,
    newCount: newFindings.length,
    fixedCount: fixedFindings.length,
    failed: newFindings.length > 0
  };
}

function runRatchet(config, mode = "ratchet") {
  const results = [];
  for (const gate of config.ratchet_gates ?? []) {
    results.push(compareGate(gate, mode));
  }

  let failed = false;
  for (const result of results) {
    if (mode === "init") {
      console.log(`initialized ${result.id}: ${result.current} baseline findings`);
      continue;
    }

    if (result.fixedCount > 0) {
      console.log(`ratchet shrank ${result.id}: ${result.fixedCount} fixed`);
    }

    if (result.failed) {
      failed = true;
      console.error(`new findings in ${result.id}: ${result.newCount}`);
      for (const finding of result.newFindings.slice(0, 20)) {
        const location = finding.line ? `${finding.file}:${finding.line}` : finding.file;
        console.error(`- ${finding.severity} ${finding.tool}/${finding.ruleId} ${location} ${finding.message}`);
      }
      if (result.newFindings.length > 20) {
        console.error(`- ... ${result.newFindings.length - 20} more`);
      }
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    results: results.map((result) => ({
      id: result.id,
      current: result.current,
      baseline: result.baseline,
      newCount: result.newCount,
      fixedCount: result.fixedCount,
      failed: result.failed
    }))
  };

  writeJson(path.join(root, ".quality/ratchet-report.json"), report);

  if (failed) {
    throw new Error("ratchet failed because new findings were introduced");
  }

  console.log("ratchet passed");
}

function runStatus(config) {
  const rows = [];
  for (const gate of config.ratchet_gates ?? []) {
    const current = readJson(path.join(root, gate.current), []);
    const baseline = readJson(path.join(root, gate.baseline), []);
    rows.push({
      gate: gate.id,
      current: summarizeFindings(current),
      baseline: summarizeFindings(baseline)
    });
  }
  console.log(JSON.stringify(rows, null, 2));
}

function printHelp() {
  console.log(`Usage: node tools/quality/quality-runner.mjs <command>\n\nCommands:\n  collect         Run ratchet collectors and parsers\n  ratchet         Collect findings and compare them with baselines\n  init            Collect findings and initialize baselines\n  status          Show current and baseline finding counts\n  help            Show this help\n`);
}

try {
  const config = command === "help" ? undefined : loadConfig();

  if (command === "collect") {
    runCollect(config);
  } else if (command === "ratchet") {
    runCollect(config);
    runRatchet(config, "ratchet");
  } else if (command === "init") {
    runCollect(config);
    runRatchet(config, "init");
  } else if (command === "status") {
    runStatus(config);
  } else {
    printHelp();
  }
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
