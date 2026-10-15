import type { CitedFindingCard } from "../domain/chatTypes.js";

type KnownCitationIds = {
  readonly findingIds: ReadonlySet<string>;
  readonly ruleIds: ReadonlySet<string>;
  readonly featureIds: ReadonlySet<string>;
};

const FINDING_ID_PATTERN = /[a-f0-9]{64}:\d+:[a-z0-9_.]+/i;

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

/** Words that make a reply a statement about dataset quality, which must be backed by tool ids. */
const QUALITY_CLAIM_TERMS =
  /\b(findings?|issues?|errors?|warnings?|rules?|features?|invalid|valid|geometr(?:y|ies)|polygons?|self-intersect\w*|duplicates?|empty|problems?|defects?|overlap\w*|clean)\b/;

/** A concrete defect or count; its presence cancels any refusal exemption. */
const SPECIFIC_DEFECT =
  /self-intersect|duplicate|overlap|empty geometry|\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+(\w+\s+)?(errors?|issues?|findings?|problems?|polygons?|features?)\b/;

/** Plain refusals may mention geometry in general terms without citing ids. */
export function assistantReplyExemptFromCitationGuard(text: string): boolean {
  const lowered = text.toLowerCase();
  if (SPECIFIC_DEFECT.test(lowered)) return false;
  if (lowered.includes("out of scope")) return true;
  if (lowered.includes("cannot do that")) return true;
  if (/cannot (repair|edit|mutate|change)/.test(lowered)) return true;
  if (/run validation before/.test(lowered)) return true;
  if (/unknown finding|cannot invent|do not guess|cannot answer/.test(lowered)) return true;
  return false;
}

/** True when the reply says anything about dataset quality, so it must cite tool-backed ids. */
export function assistantStatesValidationResults(text: string): boolean {
  if (FINDING_ID_PATTERN.test(text)) return true;
  if (assistantReplyExemptFromCitationGuard(text)) return false;
  return QUALITY_CLAIM_TERMS.test(text.toLowerCase());
}

/**
 * Every id the reply names must come from tool output: a finding id the tools returned, a rule id
 * of such a finding, or a feature id on a loaded card. Invented ids such as "ID001" or "dup-1" fail.
 */
export function assistantCitesOnlyKnownIds(text: string, known: KnownCitationIds): boolean {
  const knownRules = new Set([...known.ruleIds, ...[...known.findingIds].map((id) => id.slice(id.lastIndexOf(":") + 1))]);
  const named = (pattern: RegExp) => [...text.matchAll(pattern)].map((match) => (match[1] ?? match[0]).replace(/[.,;:!?]+$/, ""));
  const findingIds = [...named(/[a-f0-9]{64}:\d+:[a-z0-9_.]+[a-z0-9_]/gi), ...named(/\bfinding\s*id\s*:?\s*([^\s,;()]+)/gi)];
  const featureIds = named(/\bfeature\s*id\s*:?\s*([^\s,;():]+)/gi);
  const ruleIds = [...named(/\brule\s*id\s*:?\s*([^\s,;()]+)/gi), ...named(/\b(?:geometry|identifier)\.[a-z_]+\b/g)];
  return findingIds.every((id) => known.findingIds.has(id))
    && featureIds.every((id) => known.featureIds.has(id))
    && ruleIds.every((id) => knownRules.has(id));
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
