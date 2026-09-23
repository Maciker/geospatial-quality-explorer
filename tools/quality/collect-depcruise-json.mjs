#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

mkdirSync(".quality", { recursive: true });

const emptyReport = "{\"modules\":[],\"summary\":{\"violations\":[]}}\n";

function collectDependencyCruiserReport() {
  try {
    return execSync("pnpm exec depcruise apps packages test tools --config dependency-cruiser.config.cjs --output-type json", {
      cwd: process.cwd(),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
  } catch (error) {
    // dependency-cruiser exits non-zero when it finds violations. For ratchet collection that is expected.
    if (error.stderr) process.stderr.write(String(error.stderr));
    return typeof error.stdout === "string" ? error.stdout : "";
  }
}

const report = collectDependencyCruiserReport();
writeFileSync(".quality/depcruise.json", report.trim() ? report : emptyReport);
