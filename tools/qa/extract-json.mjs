#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
const inputPath = args[0];
const outIndex = args.indexOf("--out");
const outputPath = outIndex >= 0 ? args[outIndex + 1] : ".ai/workspace/qa/outputs/qa-review.json";

if (!inputPath) {
  console.error("Usage: node tools/qa/extract-json.mjs <raw-model-output.md|json> [--out <path>]");
  process.exit(1);
}

const raw = fs.readFileSync(inputPath, "utf8").trim();

function tryParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
}

function extractJson(value) {
  const direct = tryParse(value);
  if (direct) return direct;

  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    const parsed = tryParse(fenced[1].trim());
    if (parsed) return parsed;
  }

  const firstBrace = value.indexOf("{");
  const lastBrace = value.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const parsed = tryParse(value.slice(firstBrace, lastBrace + 1));
    if (parsed) return parsed;
  }

  throw new Error("Could not extract valid JSON from model output");
}

const json = extractJson(raw);
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(json, null, 2)}\n`);
console.log(`Extracted QA JSON to ${outputPath}`);
