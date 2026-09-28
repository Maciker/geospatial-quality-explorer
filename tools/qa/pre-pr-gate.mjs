#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { absolutePath, qaRuntimeArgs, readJsonFile, resolveRefSha, sha256, workingTreeSnapshot } from "./qa-context.mjs";

const { root, contextPath, outputPath, manifestPath } = qaRuntimeArgs();

function fail(message) {
  throw new Error(message);
}

function runNode(script, args) {
  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: root,
    stdio: "inherit",
  });
  if ((result.status ?? 1) !== 0) {
    fail(script + " failed");
  }
}

const context = readJsonFile(root, contextPath);
if (context.schemaVersion !== 1) fail("Unsupported QA context schema");
const currentHeadSha = resolveRefSha(root, context.headRef ?? "HEAD");
if (currentHeadSha !== context.headSha) {
  fail("QA invalidated: HEAD changed from " + context.headSha + " to " + currentHeadSha);
}

const inputAbsolute = absolutePath(root, context.inputPath);
if (!fs.existsSync(inputAbsolute)) fail("Missing QA input " + context.inputPath);
if (sha256(fs.readFileSync(inputAbsolute, "utf8")) !== context.inputSha256) {
  fail("QA invalidated: QA input changed");
}

const currentSnapshot = workingTreeSnapshot(root);
for (const key of ["statusSha256", "unstagedDiffSha256", "stagedDiffSha256"]) {
  if (currentSnapshot[key] !== context.workingTree[key]) {
    fail("QA invalidated: working tree changed (" + key + ")");
  }
}

const manifest = readJsonFile(root, manifestPath);
if (manifest.schemaVersion !== 1) fail("Unsupported QA run manifest schema");
if (manifest.headSha !== context.headSha) fail("QA invalidated: run manifest targets another head SHA");
if (manifest.inputSha256 !== context.inputSha256) fail("QA invalidated: run manifest targets another QA input");
if (manifest.modelVerification !== "verified" || manifest.modelDistinct !== true) {
  fail("Independent model verification is missing; do not open the PR");
}

const reviewAbsolute = absolutePath(root, outputPath);
if (!fs.existsSync(reviewAbsolute)) fail("Missing QA review " + outputPath);
if (manifest.reviewSha256 !== sha256(fs.readFileSync(reviewAbsolute, "utf8"))) {
  fail("QA invalidated: review output changed after model metadata was recorded");
}

runNode("tools/qa/validate-qa-review.mjs", [outputPath]);
runNode("tools/qa/qa-gate.mjs", [outputPath]);

console.log(JSON.stringify({
  passed: true,
  headSha: context.headSha,
  reviewerIdentity: manifest.reviewerIdentity,
  implementerIdentity: manifest.implementerIdentity,
  message: "Pre-PR QA gate passed for the exact reviewed worktree",
}, null, 2));
