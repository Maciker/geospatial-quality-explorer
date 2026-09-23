import fs from "node:fs";

// Shared CLI argument helpers for the tools/ scripts. Two option variants are
// intentionally provided: `value` ignores the next token when it looks like
// another flag (starts with "--"); `valueLoose` accepts any following token.
export function argHelpers(argv = process.argv.slice(2)) {
  const value = (name, fallback) => {
    const index = argv.indexOf(name);
    if (index >= 0 && argv[index + 1] && !argv[index + 1].startsWith("--")) return argv[index + 1];
    return fallback;
  };
  const valueLoose = (name, fallback) => {
    const index = argv.indexOf(name);
    if (index >= 0 && argv[index + 1]) return argv[index + 1];
    return fallback;
  };
  const flag = (name) => argv.includes(name);
  return { args: argv, value, valueLoose, flag };
}

// Positional-input + `--out` parsing shared by the findings collectors, plus the
// input JSON report read. Returns the resolved paths, root and parsed report.
export function readReportArgs(defaultInput) {
  const argv = process.argv.slice(2);
  const inputPath = argv[0] && !argv[0].startsWith("--") ? argv[0] : defaultInput;
  const outIndex = argv.indexOf("--out");
  const outputPath = outIndex >= 0 ? argv[outIndex + 1] : undefined;
  const root = process.cwd();
  const report = fs.existsSync(inputPath) ? JSON.parse(fs.readFileSync(inputPath, "utf8")) : {};
  return { inputPath, outputPath, root, report };
}
