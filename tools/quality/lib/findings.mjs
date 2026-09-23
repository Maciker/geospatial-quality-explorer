import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const VALID_SEVERITIES = new Set(["info", "warning", "error"]);

export function fingerprint(parts) {
  return crypto.createHash("sha1").update(parts.filter(Boolean).join("|"), "utf8").digest("hex");
}

export function normalizePath(filePath, root = process.cwd()) {
  if (!filePath) return "unknown";
  const normalized = String(filePath).replaceAll("\\", "/");
  const rootNormalized = String(root).replaceAll("\\", "/");
  const isAbsoluteLike = path.isAbsolute(normalized) || /^[A-Za-z]:\//.test(normalized);
  if (isAbsoluteLike && normalized.toLowerCase().startsWith(`${rootNormalized.toLowerCase()}/`)) {
    return normalized.slice(rootNormalized.length + 1);
  }
  return normalized.replace(/^\.\//, "");
}

export function normalizeSeverity(value, fallback = "warning") {
  if (value === 2 || value === "error") return "error";
  if (value === 1 || value === "warn" || value === "warning") return "warning";
  if (value === 0 || value === "info") return "info";
  return fallback;
}

export function normalizeFinding(raw, root = process.cwd()) {
  const tool = String(raw.tool ?? "unknown");
  const ruleId = String(raw.ruleId ?? "unknown");
  const file = normalizePath(raw.file ?? raw.source ?? "unknown", root);
  const line = Number.isInteger(raw.line) ? raw.line : undefined;
  const column = Number.isInteger(raw.column) ? raw.column : undefined;
  const message = String(raw.message ?? "No message provided");
  const severity = normalizeSeverity(raw.severity);
  const fp = raw.fingerprint ?? fingerprint([tool, ruleId, file, line ?? "", message]);

  return {
    tool,
    ruleId,
    severity: VALID_SEVERITIES.has(severity) ? severity : "warning",
    file,
    ...(line === undefined ? {} : { line }),
    ...(column === undefined ? {} : { column }),
    message,
    fingerprint: fp
  };
}

export function readJson(filePath, fallback = []) {
  if (!fs.existsSync(filePath)) return fallback;
  const content = fs.readFileSync(filePath, "utf8").trim();
  if (!content) return fallback;
  return JSON.parse(content);
}

export function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function readFindings(filePath, root = process.cwd()) {
  const data = readJson(filePath, []);
  if (!Array.isArray(data)) {
    throw new Error(`Expected ${filePath} to contain a JSON array of findings`);
  }
  return data.map((finding) => normalizeFinding(finding, root));
}

export function writeFindings(filePath, findings, root = process.cwd()) {
  writeJson(filePath, findings.map((finding) => normalizeFinding(finding, root)));
}

export function compareFindings(current, baseline) {
  const currentMap = new Map(current.map((finding) => [finding.fingerprint, finding]));
  const baselineMap = new Map(baseline.map((finding) => [finding.fingerprint, finding]));

  const newFindings = current.filter((finding) => !baselineMap.has(finding.fingerprint));
  const remainingBaseline = baseline.filter((finding) => currentMap.has(finding.fingerprint));
  const fixedFindings = baseline.filter((finding) => !currentMap.has(finding.fingerprint));

  return {
    newFindings,
    remainingBaseline,
    fixedFindings
  };
}

export function summarizeFindings(findings) {
  const summary = { total: findings.length, error: 0, warning: 0, info: 0 };
  for (const finding of findings) {
    summary[finding.severity] += 1;
  }
  return summary;
}
