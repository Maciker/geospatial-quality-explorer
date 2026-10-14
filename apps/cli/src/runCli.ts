import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import {
  DomainError,
  PlanarPolygonEngine,
  Sha256Digest,
  buildQgisBundle,
  buildQualityReport,
  conciseReport,
  runFromReport,
  validateDataset,
  type QualityReport,
  type ValidationRun,
} from "../../../packages/quality/src/index.js";
import { openPostgis } from "../../../packages/persistence/src/index.js";

type CliIo = {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
  readonly env: Readonly<Record<string, string | undefined>>;
};

const engine = new PlanarPolygonEngine();
const digest = new Sha256Digest();

type Command = {
  readonly words: readonly string[];
  readonly options: readonly string[];
  readonly run: (options: Map<string, string>, io: CliIo) => Promise<number>;
};

const RUN_SOURCE = ["run-id", "input", "database"];

const COMMANDS: readonly Command[] = [
  { words: ["migrate"], options: ["database"], run: (options, io) => migrate(options, io) },
  {
    words: ["validate"],
    options: ["input", "source-crs", "name", "license", "output", "report", "database"],
    run: (options, io) => validate(options, io),
  },
  { words: ["runs", "show"], options: RUN_SOURCE, run: (options, io) => showRun(options, io) },
  { words: ["export", "qgis"], options: [...RUN_SOURCE, "output"], run: (options, io) => exportQgis(options, io) },
  { words: ["report"], options: [...RUN_SOURCE, "output"], run: (options, io) => exportReport(options, io) },
];

export async function runCli(argv: readonly string[], io: CliIo): Promise<number> {
  try {
    const command = COMMANDS.find((candidate) => candidate.words.every((word, index) => argv[index] === word));
    if (!command) {
      io.stderr("Usage: gis validate|migrate|runs show|export qgis|report\n");
      return 1;
    }
    const options = readOptions(argv.slice(command.words.length), command.options);
    return await command.run(options, io);
  } catch (error) {
    io.stderr(`${error instanceof Error ? error.message : "Command failed."}\n`);
    return 1;
  }
}

async function validate(options: Map<string, string>, io: CliIo): Promise<number> {
  const inputPath = required(options, "input");
  const sourceCrs = required(options, "source-crs");
  const name = required(options, "name");
  const license = required(options, "license");
  const sourceBytes = await readFile(resolve(inputPath));
  let collection: unknown;
  try {
    collection = JSON.parse(sourceBytes.toString("utf8")) as unknown;
  } catch {
    throw DomainError.createValidation("dataset.invalid_json: The input is not JSON.");
  }
  const now = new Date();
  const run = validateDataset({
    collection,
    sourceBytes,
    declaration: { name, sourceCrs, license, parameters: {} },
    digest,
    engine,
    startedAt: now,
    completedAt: now,
  });
  const databaseUrl = options.get("database") ?? io.env.GEOSPATIAL_POSTGIS_URL;
  if (databaseUrl) {
    const opened = await openPostgis(databaseUrl);
    try {
      await opened.repository.save(run);
    } finally {
      await opened.close();
    }
  }
  const report = `${JSON.stringify(buildQualityReport(run), null, 2)}\n`;
  const text = conciseReport(run);
  const output = options.get("output");
  const reportPath = options.get("report");
  if (output) await writeText(output, report);
  if (reportPath) await writeText(reportPath, text);
  io.stdout(text);
  return run.findings.length === 0 ? 0 : 2;
}

async function showRun(options: Map<string, string>, io: CliIo): Promise<number> {
  const run = await loadRun(options, io);
  io.stdout(conciseReport(run));
  return 0;
}

async function exportReport(options: Map<string, string>, io: CliIo): Promise<number> {
  const run = await loadRun(options, io);
  await writeText(required(options, "output"), `${JSON.stringify(buildQualityReport(run), null, 2)}\n`);
  io.stdout(`Wrote report for ${run.runId}\n`);
  return 0;
}

async function exportQgis(options: Map<string, string>, io: CliIo): Promise<number> {
  const run = await loadRun(options, io);
  const directory = required(options, "output");
  const bundle = buildQgisBundle(run);
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, "findings.geojson"), bundle.geojson);
  await writeFile(resolve(directory, "run-metadata.json"), bundle.metadata);
  await writeFile(resolve(directory, "findings.qgs"), bundle.project);
  await writeFile(resolve(directory, "findings.qml"), bundle.style);
  io.stdout(`Wrote QGIS bundle for ${run.runId}\n`);
  return 0;
}

async function migrate(options: Map<string, string>, io: CliIo): Promise<number> {
  const databaseUrl = options.get("database") ?? io.env.GEOSPATIAL_POSTGIS_URL;
  if (!databaseUrl) throw DomainError.createValidation("database.missing: Set --database or GEOSPATIAL_POSTGIS_URL.");
  const opened = await openPostgis(databaseUrl);
  try {
    io.stdout(opened.applied.length === 0 ? "No pending migrations.\n" : `Applied ${opened.applied.join(", ")}\n`);
    return 0;
  } finally {
    await opened.close();
  }
}

async function loadRun(options: Map<string, string>, io: CliIo): Promise<ValidationRun> {
  const input = options.get("input");
  if (input) {
    const report = JSON.parse(await readFile(resolve(input), "utf8")) as QualityReport;
    if (report.reportVersion !== "1.0.0" || !Array.isArray(report.findings)) {
      throw DomainError.createValidation("report.invalid: The report file is unreadable.");
    }
    return runFromReport(report);
  }
  const runId = required(options, "run-id");
  const databaseUrl = options.get("database") ?? io.env.GEOSPATIAL_POSTGIS_URL;
  if (!databaseUrl) throw DomainError.createValidation("database.missing: Set --database or GEOSPATIAL_POSTGIS_URL.");
  const opened = await openPostgis(databaseUrl);
  try {
    return (await opened.repository.findById(runId)).orElseThrow(DomainError.createNotFound(`unknown run ${runId}`));
  } finally {
    await opened.close();
  }
}

function readOptions(argv: readonly string[], allowed: readonly string[]): Map<string, string> {
  const options = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index] ?? "";
    if (!token.startsWith("--")) {
      throw DomainError.createValidation(`argument.unexpected: ${token} is not an option. Options start with --.`);
    }
    if (!allowed.includes(token.slice(2))) {
      throw DomainError.createValidation(`argument.unknown: ${token} is not supported here. Use ${allowed.map((name) => `--${name}`).join(", ")}.`);
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw DomainError.createValidation(`argument.missing: ${token} requires a value.`);
    }
    options.set(token.slice(2), value);
    index += 1;
  }
  return options;
}

function required(options: Map<string, string>, name: string): string {
  const value = options.get(name);
  if (!value) throw DomainError.createValidation(`argument.missing: --${name} is required.`);
  return value;
}

async function writeText(path: string, contents: string): Promise<void> {
  await mkdir(dirname(resolve(path)), { recursive: true });
  await writeFile(resolve(path), contents);
}
