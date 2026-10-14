import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { argHelpers } from "../lib/args.mjs";

export function sha256(value) {
  return crypto.createHash("sha256").update(String(value), "utf8").digest("hex");
}

export function runGit(root, args) {
  try {
    return execFileSync("git", args, {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    }).trimEnd();
  } catch (error) {
    throw new Error("git " + args.join(" ") + " failed: " + error.message);
  }
}

export function resolveRefSha(root, ref) {
  const sha = runGit(root, ["rev-parse", ref]).trim();
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error("Ref " + ref + " did not resolve to a full commit SHA");
  }
  return sha;
}

/**
 * Builds a comparable "provider:model" identity. Both parts are required and compared
 * case-insensitively, so "OpenAI:GPT-X" and "openai:gpt-x" are the same model.
 * Returns null when either part is missing.
 */
export function normalizeIdentity(provider, model) {
  const providerPart = String(provider ?? "").trim().toLowerCase();
  const modelPart = String(model ?? "").trim().toLowerCase();
  if (!providerPart || !modelPart) return null;
  return providerPart + ":" + modelPart;
}

/**
 * How the model identities in a QA run manifest were obtained:
 * - "harness": the reviewer identity comes from the provider call made by `pnpm qa:run`.
 * - "declared": both identities were typed by a person or agent with `pnpm qa:record`.
 * - "failed": identities are missing, equal, or the reviewer is the offline mock provider.
 * The implementer identity is always declared; no tool can observe which model wrote the code.
 */
export const IDENTITY_EVIDENCE = Object.freeze(["harness", "declared", "failed"]);

export function workingTreeSnapshot(root) {
  const status = runGit(root, ["status", "--short"]);
  const unstaged = runGit(root, ["diff", "--binary", "HEAD"]);
  const staged = runGit(root, ["diff", "--cached", "--binary"]);
  return {
    statusSha256: sha256(status),
    unstagedDiffSha256: sha256(unstaged),
    stagedDiffSha256: sha256(staged),
  };
}


export function qaArtifactPaths(argValue, aiDir = ".ai") {
  return {
    contextPath: argValue("--context", path.join(aiDir, "workspace/qa/inputs/qa-context.json")),
    outputPath: argValue("--output", path.join(aiDir, "workspace/qa/outputs/qa-review.json")),
    manifestPath: argValue("--manifest", path.join(aiDir, "workspace/qa/outputs/qa-run.json")),
  };
}

export function absolutePath(root, relativePath) {
  return path.isAbsolute(relativePath) ? relativePath : path.join(root, relativePath);
}

export function readJsonFile(root, relativePath) {
  const filePath = absolutePath(root, relativePath);
  if (!fs.existsSync(filePath)) throw new Error("Missing " + relativePath);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}


export function qaRuntimeArgs(aiDir = ".ai") {
  const root = process.cwd();
  const { value: argValue } = argHelpers();
  return { root, argValue, ...qaArtifactPaths(argValue, aiDir) };
}
