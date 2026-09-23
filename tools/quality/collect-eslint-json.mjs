#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

mkdirSync(".quality", { recursive: true });

try {
  execSync("pnpm exec eslint . -f json -o .quality/eslint.json", {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
  });
} catch {
  // ESLint exits non-zero when it finds lint errors. For ratchet collection that is expected:
  // the JSON report is the artifact we need. Only create an empty report if ESLint did not write one.
  if (!existsSync(".quality/eslint.json")) {
    writeFileSync(".quality/eslint.json", "[]\n");
  }
}
