import type { CitedFindingCard } from "../domain/chatTypes.js";

type KnownCitationIds = {
  readonly findingIds: ReadonlySet<string>;
  readonly ruleIds: ReadonlySet<string>;
  readonly featureIds: ReadonlySet<string>;
};

export function collectCitationIdsFromFindings(findings: readonly CitedFindingCard[]): KnownCitationIds {
  const findingIds = new Set<string>();
  const ruleIds = new Set<string>();
  const featureIds = new Set<string>();
  for (const finding of findings) {
    findingIds.add(finding.findingId);
    ruleIds.add(finding.ruleId);
    featureIds.add(finding.featureId);
  }
  return { findingIds, ruleIds, featureIds };
}

export function mergeCitationIds(left: KnownCitationIds, right: KnownCitationIds): KnownCitationIds {
  return {
    findingIds: new Set([...left.findingIds, ...right.findingIds]),
    ruleIds: new Set([...left.ruleIds, ...right.ruleIds]),
    featureIds: new Set([...left.featureIds, ...right.featureIds]),
  };
}

export function assistantClaimsFindings(text: string): boolean {
  const lowered = text.toLowerCase();
  return (
    lowered.includes("finding")
    || lowered.includes("issue")
    || lowered.includes("error")
    || lowered.includes("warning")
    || lowered.includes("rule")
    || lowered.includes("feature")
    || lowered.includes("invalid")
    || lowered.includes("geometry")
  );
}

export function assistantCitesKnownIds(text: string, known: KnownCitationIds): boolean {
  for (const findingId of known.findingIds) {
    if (text.includes(findingId)) return true;
  }
  for (const ruleId of known.ruleIds) {
    if (text.includes(ruleId)) return true;
  }
  for (const featureId of known.featureIds) {
    if (text.includes(featureId)) return true;
  }
  return false;
}

export function refusalTextForMissingCitation(): string {
  return "I cannot state validation results without citing findingId, ruleId, or featureId from the tools. Please ask again after I fetch findings.";
}
