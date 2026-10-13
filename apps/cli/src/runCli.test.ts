import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./runCli.js";

const clean = "packages/quality/fixtures/vector/clean.geojson";
const invalid = "packages/quality/fixtures/vector/invalid-polygon.geojson";

function capture() {
  const stdout: string[] = [];
  const stderr: string[] = [];
  return {
    stdout: (text: string) => stdout.push(text),
    stderr: (text: string) => stderr.push(text),
    env: {},
    text: () => stdout.join(""),
    errors: () => stderr.join(""),
  };
}

function processExit(args: readonly string[]): number {
  const result = spawnSync("pnpm", ["exec", "tsx", "apps/cli/src/main.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  return result.status ?? 1;
}

describe("The validation CLI", () => {
  it("documents clean, finding, and invalid exit codes", () => {
    const shared = ["--source-crs", "EPSG:4326", "--name", "demo", "--license", "CC0-1.0"];

    expect(processExit(["validate", "--input", clean, ...shared])).toBe(0);
    expect(processExit(["validate", "--input", invalid, ...shared])).toBe(2);
    expect(processExit(["validate", "--input", "missing-dataset.geojson", ...shared])).toBe(1);
  });

  it("writes JSON and a concise report without changing the source file", async () => {
    const directory = await mkdtemp(join(tmpdir(), "gis-cli-"));
    const sourcePath = join(directory, "clean.geojson");
    const original = await readFile(clean);
    await writeFile(sourcePath, original);
    const io = capture();

    const code = await runCli([
      "validate",
      "--input",
      sourcePath,
      "--source-crs",
      "EPSG:4326",
      "--name",
      "clean",
      "--license",
      "CC0-1.0",
      "--output",
      join(directory, "report.json"),
      "--report",
      join(directory, "report.txt"),
    ], io);

    expect(code).toBe(0);
    expect(await readFile(sourcePath)).toEqual(original);
    const report = JSON.parse(await readFile(join(directory, "report.json"), "utf8")) as { findings: unknown[]; dataset: { sourceHash: string } };
    expect(report.findings).toEqual([]);
    expect(report.dataset.sourceHash).toHaveLength(64);
    expect(await readFile(join(directory, "report.txt"), "utf8")).toContain("No findings.");
    expect(io.text()).toContain("Ruleset vector-core@1.1.0");
  });

  it("rejects a missing input argument", async () => {
    const io = capture();

    const code = await runCli(["validate", "--source-crs", "EPSG:4326", "--name", "demo", "--license", "CC0-1.0"], io);

    expect(code).toBe(1);
    expect(io.errors()).toContain("--input is required");
  });

  it("rejects a stray positional argument instead of ignoring it", async () => {
    const io = capture();

    const code = await runCli(["validate", "input", clean, "--source-crs", "EPSG:4326", "--name", "demo", "--license", "CC0-1.0"], io);

    expect(code).toBe(1);
    expect(io.errors()).toContain("argument.unexpected: input");
  });

  it("rejects an unknown option", async () => {
    const io = capture();

    const code = await runCli(["validate", "--input", clean, "--source-crs", "EPSG:4326", "--name", "demo", "--license", "CC0-1.0", "--ouput", "x.json"], io);

    expect(code).toBe(1);
    expect(io.errors()).toContain("argument.unknown: --ouput");
  });

  it("accepts the documented subcommands", async () => {
    const io = capture();

    const code = await runCli(["runs", "show"], io);

    expect(code).toBe(1);
    expect(io.errors()).toContain("--run-id is required");
  });
});
