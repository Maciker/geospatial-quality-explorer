import type { FindingSummary } from "../../../alexa-tools/src/domain/toolContracts.js";
import type { CitedFindingCard } from "../domain/chatTypes.js";

export function findingSummariesToCards(findings: readonly FindingSummary[]): readonly CitedFindingCard[] {
  return findings.map((finding) => ({
    findingId: finding.findingId,
    ruleId: finding.ruleId,
    featureId: finding.featureId,
    severity: finding.severity,
    explanation: finding.explanation,
    suggestedAction: finding.suggestedAction,
    geometry: finding.geometry,
  }));
}

export function mergeFindingCards(
  existing: readonly CitedFindingCard[],
  incoming: readonly CitedFindingCard[],
): readonly CitedFindingCard[] {
  const byId = new Map<string, CitedFindingCard>();
  for (const card of existing) byId.set(card.findingId, card);
  for (const card of incoming) byId.set(card.findingId, card);
  return [...byId.values()];
}
