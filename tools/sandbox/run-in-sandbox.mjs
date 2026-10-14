#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { argHelpers } from "../lib/args.mjs";

const root = process.cwd();
const { value: argValue, flag: hasFlag } = argHelpers();

const ref = argValue("--ref", "HEAD");
const command = argValue("--cmd", "pnpm quality:full");
const keep = hasFlag("--keep");
const skipInstall = hasFlag("--no-install");
const sandboxRoot = argValue("--dir", path.join(root, ".sandbox"));

function git(gitArgs, options = {}) {
  return spawnSync("git", gitArgs, { cwd: root, encoding: "utf8", ...options });
}

function ensureGitRepo() {
  const result = git(["rev-parse", "--is-inside-work-tree"]);
  if ((result.status ?? 1) !== 0) {
    throw new Error("Not a git repository. The sandbox runs gates against a clean git worktree.");
  }
}

function createWorktree() {
  fs.mkdirSync(sandboxRoot, { recursive: true });
  const worktreePath = path.join(sandboxRoot, `wt-${Date.now()}`);
  console.log(`[sandbox] creating isolated worktree at ${path.relative(root, worktreePath)} from ${ref}`);
  const result = git(["worktree", "add", "--detach", worktreePath, ref], { stdio: "inherit" });
  if ((result.status ?? 1) !== 0) throw new Error(`git worktree add failed for ref ${ref}`);
  return worktreePath;
}

function removeWorktree(worktreePath) {
  console.log(`[sandbox] removing worktree ${path.relative(root, worktreePath)}`);
  git(["worktree", "remove", "--force", worktreePath], { stdio: "inherit" });
}

function run(cwd, cmd) {
  console.log(`\n[sandbox] $ ${cmd}`);
  return spawnSync(cmd, { cwd, stdio: "inherit", shell: true }).status ?? 1;
}

function main() {
  ensureGitRepo();
  const worktreePath = createWorktree();
  let exitCode = 1;
  try {
    if (!skipInstall) {
      // A detached git worktree isolates the checkout, not the network or the file system;
      // install exactly the locked dependencies so the gate runs against reviewed versions.
      exitCode = run(worktreePath, "pnpm install --frozen-lockfile --prefer-offline");
      if (exitCode !== 0) {
        console.error("[sandbox] dependency install failed");
        return;
      }
    }
    exitCode = run(worktreePath, command);
  } finally {
    if (!keep) {
      removeWorktree(worktreePath);
    } else {
      console.log(`[sandbox] --keep set; leaving worktree at ${worktreePath}`);
    }
  }
  console.log(`\n[sandbox] command exited with code ${exitCode}`);
  process.exit(exitCode);
}

try {
  main();
} catch (error) {
  console.error(`[sandbox] ${error.message}`);
  process.exit(1);
}
