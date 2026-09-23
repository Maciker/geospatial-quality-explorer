import { DomainError } from "../domain/DomainError.js";
import type { Finding, GeoJsonGeometry } from "../domain/geometry.js";
import { DATASET_LIMITS } from "../domain/limits.js";

export type FindingQuery = {
  readonly severity: Finding["severity"] | null;
  readonly ruleId: string | null;
  readonly bbox: readonly [number, number, number, number] | null;
  readonly limit: number;
  readonly cursor: string | null;
};

export type FindingPage = {
  readonly findings: readonly Finding[];
  readonly nextCursor: string | null;
};

const RULE_ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

export function parseFindingQuery(searchParams: URLSearchParams): FindingQuery {
  const severityValue = searchParams.get("severity");
  const severity = severityValue === null ? null : parseSeverity(severityValue);
  const ruleValue = searchParams.get("ruleId");
  if (ruleValue !== null && !RULE_ID_PATTERN.test(ruleValue)) {
    throw DomainError.createValidation("query.rule_id: Rule id contains unsupported characters.");
  }
  const limitValue = searchParams.get("limit");
  const limit = limitValue === null ? DATASET_LIMITS.defaultPageSize : parseLimit(limitValue);
  const cursor = searchParams.get("cursor");
  if (cursor !== null && !isCursor(cursor)) {
    throw DomainError.createValidation("query.cursor: Cursor is malformed.");
  }
  return {
    severity,
    ruleId: ruleValue,
    bbox: parseBbox(searchParams.get("bbox")),
    limit,
    cursor,
  };
}

export function pageFindings(findings: readonly Finding[], query: FindingQuery): FindingPage {
  const filtered = findings.filter((finding) => matchesQuery(finding, query));
  const start = query.cursor === null ? 0 : filtered.findIndex((finding) => findingCursor(finding) === query.cursor) + 1;
  if (query.cursor !== null && start === 0) {
    throw DomainError.createValidation("query.cursor: Cursor does not match this result.");
  }
  const page = filtered.slice(start, start + query.limit);
  const next = filtered[start + query.limit];
  return { findings: page, nextCursor: next ? findingCursor(next) : null };
}

export function findingCursor(finding: Finding): string {
  return Buffer.from(`${finding.featureIndex}:${finding.ruleId}:${finding.findingId}`, "utf8").toString("base64url");
}

function matchesQuery(finding: Finding, query: FindingQuery): boolean {
  if (query.severity !== null && finding.severity !== query.severity) return false;
  if (query.ruleId !== null && finding.ruleId !== query.ruleId) return false;
  if (query.bbox === null) return true;
  if (finding.geometry === null) return false;
  return envelopesOverlap(envelope(finding.geometry), query.bbox);
}

function parseSeverity(value: string): Finding["severity"] {
  if (value === "error" || value === "warning" || value === "info") return value;
  throw DomainError.createValidation("query.severity: Severity must be error, warning, or info.");
}

function parseLimit(value: string): number {
  if (!/^[0-9]+$/.test(value)) throw DomainError.createValidation("query.limit: Limit must be a positive integer.");
  const limit = Number(value);
  if (limit < 1 || limit > DATASET_LIMITS.maxPageSize) {
    throw DomainError.createValidation(`query.limit: Limit must be from 1 to ${DATASET_LIMITS.maxPageSize}.`);
  }
  return limit;
}

function parseBbox(value: string | null): FindingQuery["bbox"] {
  if (value === null) return null;
  const parts = value.split(",");
  if (parts.length !== 4 || parts.some((part) => !/^-?[0-9]+(?:\.[0-9]+)?$/.test(part))) {
    throw DomainError.createValidation("query.bbox: Bbox must be minLon,minLat,maxLon,maxLat.");
  }
  const numbers = parts.map(Number) as [number, number, number, number];
  const [minLon, minLat, maxLon, maxLat] = numbers;
  if (minLon < -180 || maxLon > 180 || minLat < -90 || maxLat > 90 || minLon >= maxLon || minLat >= maxLat) {
    throw DomainError.createValidation("query.bbox: Bbox is outside WGS84 or is empty.");
  }
  return numbers;
}

function isCursor(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function envelope(geometry: GeoJsonGeometry): readonly [number, number, number, number] {
  const positions = geometry.type === "Polygon" ? geometry.coordinates.flat() : geometry.coordinates.flat(2);
  const first = positions[0];
  if (!first) return [0, 0, 0, 0];
  let minLon = first[0];
  let minLat = first[1];
  let maxLon = first[0];
  let maxLat = first[1];
  for (const position of positions) {
    minLon = Math.min(minLon, position[0]);
    minLat = Math.min(minLat, position[1]);
    maxLon = Math.max(maxLon, position[0]);
    maxLat = Math.max(maxLat, position[1]);
  }
  return [minLon, minLat, maxLon, maxLat];
}

function envelopesOverlap(
  left: readonly [number, number, number, number],
  right: readonly [number, number, number, number],
): boolean {
  return left[0] <= right[2] && left[2] >= right[0] && left[1] <= right[3] && left[3] >= right[1];
}
