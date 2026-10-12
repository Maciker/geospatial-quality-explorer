import type { Finding } from "../../../quality/src/domain/geometry.js";

const SEVERITY_RANK: Record<Finding["severity"], number> = {
  error: 0,
  warning: 1,
  info: 2,
};

export function prioritizeFindings(findings: readonly Finding[]): Finding[] {
  return [...findings].sort(compareFindings);
}

function compareFindings(left: Finding, right: Finding): number {
  const severityDelta = SEVERITY_RANK[left.severity] - SEVERITY_RANK[right.severity];
  if (severityDelta !== 0) return severityDelta;
  if (left.featureIndex !== right.featureIndex) return left.featureIndex - right.featureIndex;
  if (left.ruleId !== right.ruleId) return left.ruleId < right.ruleId ? -1 : 1;
  return left.findingId < right.findingId ? -1 : left.findingId > right.findingId ? 1 : 0;
}

export function findingPageCursor(finding: Finding): string {
  return Buffer.from(`${finding.featureIndex}:${finding.ruleId}:${finding.findingId}`, "utf8").toString("base64url");
}

export function pagePrioritizedFindings(
  findings: readonly Finding[],
  limit: number,
  cursor: string | null,
): { readonly findings: readonly Finding[]; readonly nextCursor: string | null } {
  const ordered = prioritizeFindings(findings);
  const start = cursor === null ? 0 : ordered.findIndex((finding) => findingPageCursor(finding) === cursor) + 1;
  if (cursor !== null && start === 0) {
    return { findings: [], nextCursor: null };
  }
  const page = ordered.slice(start, start + limit);
  const next = ordered[start + limit];
  return { findings: page, nextCursor: next ? findingPageCursor(next) : null };
}
