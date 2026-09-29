#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { absolutePath, qaRuntimeArgs, readJsonFile, sha256 } from "./qa-context.mjs";

const { root, argValue, contextPath, outputPath, manifestPath } = qaRuntimeArgs();

function fail(message) {
  throw new Error(message);
}

const context = readJsonFile(root, contextPath);
const reviewerProvider = argValue("--reviewer-provider", null);
const reviewerModel = argValue("--reviewer-model", null);
const implementerProvider = argValue("--implementer-provider", context.implementerProvider ?? null);
const implementerModel = argValue("--implementer-model", context.implementerModel ?? null);

if (!reviewerModel) fail("A verified reviewer model is required");
if (!implementerModel) fail("A verified implementer model is required");

const reviewerIdentity = reviewerProvider ? reviewerProvider + ":" + reviewerModel : reviewerModel;
const implementerIdentity = implementerProvider ? implementerProvider + ":" + implementerModel : implementerModel;
const modelDistinct = reviewerIdentity !== implementerIdentity;
const reviewAbsolute = absolutePath(root, outputPath);
if (!fs.existsSync(reviewAbsolute)) fail("Missing QA review at " + outputPath);

const manifest = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  contextPath,
  inputPath: context.inputPath,
  inputSha256: context.inputSha256,
  headSha: context.headSha,
  outputPath,
  reviewSha256: sha256(fs.readFileSync(reviewAbsolute, "utf8")),
  reviewerProvider,
  reviewerModel,
  implementerProvider,
  implementerModel,
  reviewerIdentity,
  implementerIdentity,
  modelDistinct,
  modelVerification: modelDistinct ? "verified" : "failed",
};

const manifestAbsolute = absolutePath(root, manifestPath);
fs.mkdirSync(path.dirname(manifestAbsolute), { recursive: true });
fs.writeFileSync(manifestAbsolute, JSON.stringify(manifest, null, 2) + "\n");

if (!modelDistinct) {
  fail("Reviewer and implementer identities are equal; independent QA is unavailable");
}

console.log(JSON.stringify({
  recorded: true,
  reviewerIdentity,
  implementerIdentity,
  modelVerification: manifest.modelVerification,
}, null, 2));
