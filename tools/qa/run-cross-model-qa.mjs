#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createLLMClient, resolveConfig } from "../ai/llm-client.mjs";
import { ensureDirFor, resolveAiDir } from "../lib/workspace.mjs";
import { argHelpers } from "../lib/args.mjs";
import { normalizeIdentity, sha256 } from "./qa-context.mjs";

const root = process.cwd();
const { value: argValue, flag: hasFlag } = argHelpers();

const ai = resolveAiDir(root);
const inputPath = argValue("--input", path.join(ai, "workspace/qa/inputs/qa-input.md"));
const outputPath = argValue("--output", path.join(ai, "workspace/qa/outputs/qa-review.json"));
const contextPath = argValue("--context", path.join(ai, "workspace/qa/inputs/qa-context.json"));
const runManifestPath = argValue("--manifest", path.join(ai, "workspace/qa/outputs/qa-run.json"));
const promptPath = argValue("--prompt", path.join(ai, "prompts/qa-cross-model.md"));
const schemaPath = argValue("--schema", "quality/schemas/qa-review.schema.json");
const base = argValue("--base", "origin/main");
const head = argValue("--head", "HEAD");

function readFileOrFail(relative, hint) {
  const absolute = path.isAbsolute(relative) ? relative : path.join(root, relative);
  if (!fs.existsSync(absolute)) {
    throw new Error(`Missing ${relative}. ${hint ?? ""}`.trim());
  }
  return fs.readFileSync(absolute, "utf8");
}

function ensureInput(implementerModel, implementerProvider) {
  const absolute = path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
  if (fs.existsSync(absolute)) return;
  console.log(`[qa] ${inputPath} not found; generating it with prepare-qa-input.mjs`);
  const prepareArgs = ["tools/qa/prepare-qa-input.mjs", "--base", base, "--head", head, "--out", inputPath, "--quiet"];
  if (implementerProvider) prepareArgs.push("--implementer-provider", implementerProvider);
  if (implementerModel) prepareArgs.push("--implementer-model", implementerModel);
  const result = spawnSync(process.execPath, prepareArgs, { cwd: root, stdio: "inherit" });
  if ((result.status ?? 1) !== 0) throw new Error("Failed to prepare QA input");
}

function loadSchema() {
  const schema = JSON.parse(readFileOrFail(schemaPath, "Run from the repository root."));
  return { name: "qa_review", schema, strict: true };
}

async function main() {
  const qaConfig = resolveConfig("qa", {
    provider: argValue("--qa-provider", undefined),
    model: argValue("--qa-model", undefined),
  });

  const contextAbsolute = path.isAbsolute(contextPath) ? contextPath : path.join(root, contextPath);
  let context = fs.existsSync(contextAbsolute) ? JSON.parse(fs.readFileSync(contextAbsolute, "utf8")) : null;
  // The implementer is the agent that wrote the code (often an IDE agent), not the AI_* harness
  // client, so it must be declared explicitly instead of being inferred from AI_PROVIDER/AI_MODEL.
  const implementerProvider = argValue("--implementer-provider", context?.implementerProvider ?? undefined);
  const implementerModel = argValue("--implementer-model", context?.implementerModel ?? undefined);
  const implementerIdentity = normalizeIdentity(implementerProvider, implementerModel);
  const reviewerIdentity = normalizeIdentity(qaConfig.provider, qaConfig.model);
  if (implementerIdentity && reviewerIdentity && implementerIdentity === reviewerIdentity) {
    throw new Error(
      `Cross-model QA must use a different provider/model identity than the implementer (${implementerIdentity}). ` +
        "Set AI_QA_PROVIDER / AI_QA_MODEL or pass --qa-provider/--qa-model.",
    );
  }

  ensureInput(implementerModel, implementerProvider);
  if (!context && fs.existsSync(contextAbsolute)) context = JSON.parse(fs.readFileSync(contextAbsolute, "utf8"));

  const system = readFileOrFail(promptPath, "Generate vendor adapters or restore the canonical prompt.");
  const qaInput = readFileOrFail(inputPath);
  const responseSchema = loadSchema();

  const request = {
    system,
    prompt: qaInput,
    responseSchema,
    temperature: 0,
  };

  if (hasFlag("--dry-run")) {
    console.log(JSON.stringify({
      provider: qaConfig.provider,
      model: qaConfig.model,
      inputPath,
      outputPath,
      systemBytes: system.length,
      promptBytes: qaInput.length,
      schema: responseSchema.name,
    }, null, 2));
    return;
  }

  const client = createLLMClient(qaConfig);
  console.log(`[qa] requesting cross-model review from provider="${qaConfig.provider}" model="${qaConfig.model ?? "default"}"`);
  const result = await client.complete(request);

  const review = result.json ?? JSON.parse(result.text);
  ensureDirFor(path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath));
  fs.writeFileSync(
    path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath),
    `${JSON.stringify(review, null, 2)}\n`,
  );
  console.log(`[qa] wrote review to ${outputPath} (score=${review.score}, decision=${review.decision})`);

  const outputAbsolute = path.isAbsolute(outputPath) ? outputPath : path.join(root, outputPath);
  const runManifestAbsolute = path.isAbsolute(runManifestPath) ? runManifestPath : path.join(root, runManifestPath);
  const modelDistinct = Boolean(implementerIdentity && reviewerIdentity && implementerIdentity !== reviewerIdentity);
  const independentReviewer = modelDistinct && String(qaConfig.provider).toLowerCase() !== "mock";
  const runManifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    contextPath,
    inputPath,
    inputSha256: context?.inputSha256 ?? null,
    headSha: context?.headSha ?? null,
    outputPath,
    reviewSha256: sha256(fs.readFileSync(outputAbsolute, "utf8")),
    reviewerProvider: qaConfig.provider ?? null,
    reviewerModel: qaConfig.model ?? null,
    implementerProvider: implementerProvider ?? null,
    implementerModel: implementerModel ?? null,
    reviewerIdentity: reviewerIdentity ?? null,
    implementerIdentity: implementerIdentity ?? null,
    modelDistinct,
    // The reviewer identity comes from the provider call above; the implementer identity is declared.
    modelVerification: independentReviewer ? "harness" : "failed",
  };
  fs.mkdirSync(path.dirname(runManifestAbsolute), { recursive: true });
  fs.writeFileSync(runManifestAbsolute, JSON.stringify(runManifest, null, 2) + "\n");
  if (hasFlag("--gate") && !independentReviewer) {
    throw new Error("Cross-model QA requires a declared implementer and a distinct, non-mock reviewer identity");
  }

  const validate = spawnSync(process.execPath, ["tools/qa/validate-qa-review.mjs", outputPath], { cwd: root, stdio: "inherit" });
  if ((validate.status ?? 1) !== 0) throw new Error("QA review failed schema validation");

  if (hasFlag("--gate")) {
    const gate = spawnSync(process.execPath, ["tools/qa/qa-gate.mjs", outputPath], { cwd: root, stdio: "inherit" });
    process.exit(gate.status ?? 1);
  }
}

main().catch((error) => {
  console.error(`[qa] ${error.message}`);
  process.exit(1);
});
