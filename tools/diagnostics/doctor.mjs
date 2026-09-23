#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
let failures = 0;
const warn = (message) => console.warn(`doctor warning: ${message}`);
const fail = (message) => {
  console.error(`doctor failed: ${message}`);
  failures += 1;
};
const run = (command, args) => spawnSync(command, args, { encoding: "utf8", shell: false });

const nodeMajor = Number(process.versions.node.split(".")[0]);
if (nodeMajor < 20) fail(`Node ${process.versions.node} detected; Node 20+ is required`);

const pnpm = run(process.platform === "win32" ? "pnpm.cmd" : "pnpm", ["--version"]);
if (pnpm.status !== 0) fail("pnpm is not available on PATH");

for (const path of ["package.json", "AGENTS.md", ".ai", "tools/vendors/sync-vendors.mjs", "quality/quality.yml"]) {
  if (!existsSync(join(root, path))) fail(`missing ${path}`);
}

if (!existsSync(join(root, ".git"))) warn("this directory is not a git repository; pnpm setup:hooks requires git init first");

try {
  const packageJson = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  for (const script of ["ai:sync", "vendors:check", "codex:check", "quality:fast", "quality:full", "dogfood:check"]) {
    if (!packageJson.scripts?.[script]) fail(`missing package script ${script}`);
  }
} catch (error) {
  fail(`could not parse package.json: ${error.message}`);
}

if (failures > 0) process.exit(1);
console.log("doctor passed");
