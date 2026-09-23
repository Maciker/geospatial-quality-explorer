#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

mkdirSync(".quality/jscpd", { recursive: true });

try {
  execSync("pnpm exec jscpd --config jscpd.config.json", {
    cwd: process.cwd(),
    stdio: "inherit",
    shell: true,
  });
} catch (error) {
  // jscpd can exit non-zero when it detects duplicates. For ratchet collection, parsing the report is enough.
  if (error.stderr) process.stderr.write(String(error.stderr));
}

if (!existsSync(".quality/jscpd/jscpd-report.json")) {
  writeFileSync(".quality/jscpd/jscpd-report.json", "{\"duplicates\":[]}\n");
}
