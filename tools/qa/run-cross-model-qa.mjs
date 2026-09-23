#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { createLLMClient, resolveConfig } from "../ai/llm-client.mjs";
import { ensureDirFor, resolveAiDir } from "../lib/workspace.mjs";
import { argHelpers } from "../lib/args.mjs";

const root = process.cwd();
const { value: argValue, flag: hasFlag } = argHelpers();

const ai = resolveAiDir(root);
const inputPath = argValue("--input", path.join(ai, "workspace/qa/inputs/qa-input.md"));
const outputPath = argValue("--output", path.join(ai, "workspace/qa/outputs/qa-review.json"));
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

function ensureInput() {
  const absolute = path.isAbsolute(inputPath) ? inputPath : path.join(root, inputPath);
  if (fs.existsSync(absolute)) return;
  console.log(`[qa] ${inputPath} not found; generating it with prepare-qa-input.mjs`);
  const result = spawnSync(
    process.execPath,
    ["tools/qa/prepare-qa-input.mjs", "--base", base, "--head", head, "--out", inputPath, "--quiet"],
    { cwd: root, stdio: "inherit" },
  );
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

  const implementerModel = argValue("--implementer-model", process.env.AI_MODEL);
  if (implementerModel && qaConfig.model && implementerModel === qaConfig.model) {
    throw new Error(
      `Cross-model QA must use a different model than the implementer (${implementerModel}). ` +
        "Set AI_QA_PROVIDER / AI_QA_MODEL or pass --qa-provider/--qa-model.",
    );
  }

  ensureInput();

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
