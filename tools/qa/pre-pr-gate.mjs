#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import {
  absolutePath,
  IDENTITY_EVIDENCE,
  normalizeIdentity,
  qaRuntimeArgs,
  readJsonFile,
  resolveRefSha,
  sha256,
  workingTreeSnapshot,
} from "./qa-context.mjs";

const { root, contextPath, outputPath, manifestPath } = qaRuntimeArgs();
const requireHarness = process.argv.includes("--require-harness") || process.env.QA_REQUIRE_HARNESS === "1";

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

const reviewerIdentity = normalizeIdentity(manifest.reviewerProvider, manifest.reviewerModel);
const implementerIdentity = normalizeIdentity(manifest.implementerProvider, manifest.implementerModel);
if (!reviewerIdentity || !implementerIdentity) {
  fail("Reviewer and implementer provider/model identities are required; do not open the PR");
}
if (reviewerIdentity === implementerIdentity || manifest.modelDistinct !== true) {
  fail("Reviewer and implementer are the same model; do not open the PR");
}
if (String(manifest.reviewerProvider).trim().toLowerCase() === "mock") {
  fail("The offline mock provider is not an independent reviewer; do not open the PR");
}
const evidence = manifest.modelVerification;
if (!IDENTITY_EVIDENCE.includes(evidence) || evidence === "failed") {
  fail("Independent model evidence is missing; do not open the PR");
}
if (requireHarness && evidence !== "harness") {
  fail("Harness evidence is required (--require-harness): run the review with pnpm qa:run");
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
  reviewerIdentity,
  implementerIdentity,
  identityEvidence: evidence,
  message: evidence === "harness"
    ? "Pre-PR QA gate passed for the exact reviewed worktree; reviewer identity recorded by pnpm qa:run"
    : "Pre-PR QA gate passed for the exact reviewed worktree; model identities are declared, not machine-verified",
}, null, 2));
