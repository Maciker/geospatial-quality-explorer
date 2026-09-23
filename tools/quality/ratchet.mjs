#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const command = args.includes("--init") ? "init" : args.includes("--status") ? "status" : "ratchet";
const result = spawnSync(process.execPath, ["tools/quality/quality-runner.mjs", command], { stdio: "inherit" });
process.exit(result.status ?? 1);
