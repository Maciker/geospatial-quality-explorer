import type { CitedFindingCard } from "../domain/chatTypes.js";

type KnownCitationIds = {
  readonly findingIds: ReadonlySet<string>;
  readonly ruleIds: ReadonlySet<string>;
  readonly featureIds: ReadonlySet<string>;
};

type CitationRef = Pick<CitedFindingCard, "findingId" | "ruleId" | "featureId">;

const FINDING_ID_PATTERN = /[a-f0-9]{64}:\d+:[a-z0-9_.]+/i;

export function collectCitationIdsFromFindings(findings: readonly CitationRef[]): KnownCitationIds {
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

const QUANTITY = String.raw`(?:\d+|no|zero|one|two|three|four|five|six|seven|eight|nine|ten|several|many|some)`;
const DEFECT_NOUN = String.raw`(?:findings?|issues?|errors?|warnings?|problems?|defects?|polygons?|features?|geometr(?:y|ies)|duplicates?|self-intersections?|overlaps?)`;

/**
 * Assertions about this dataset: counts, a feature or dataset said to have a defect, or a verdict
 * such as "the data is fine". Capability text, questions and definitions are not claims.
 */
const DATASET_CLAIMS: readonly RegExp[] = [
  new RegExp(String.raw`\b${QUANTITY}\s+(?:[\w-]+\s+){0,2}${DEFECT_NOUN}\b`),
  /\bself-intersects\b|\bself-intersecting\b|\b(?:is|are) duplicated\b|\boverlaps (?:with )?\w/,
  /\b(?:has|have|had|contains?|shows?|found|detected)\s+(?:an?\s+|one\s+)?(?:[\w-]+\s+){0,2}(?:empty geometr\w*|self-intersection|duplicate|overlap|geometry errors?|errors?|problems?|issues?|defects?)\b/,
  /\bthere (?:is|are|was|were) (?:\w+\s+){0,3}(?:errors?|problems?|issues?|defects?)\b/,
  /\b(?:data|dataset|portfolio|fixture|layer|everything|it|geometr\w*|polygons?|features?|[\w-]+-\d+)\s+(?:is|are|looks?|seems?)\s+(?:all\s+)?(?:fine|clean|good|ok|okay|valid|invalid|broken|correct|corrupt\w*)\b/,
  /\blooks? (?:good|clean|fine)\b/,
];

/** True when the reply asserts something about the dataset's quality. */
export function assistantStatesValidationResults(text: string): boolean {
  if (FINDING_ID_PATTERN.test(text)) return true;
  const lowered = text.toLowerCase();
  return DATASET_CLAIMS.some((pattern) => pattern.test(lowered));
}

/**
 * A model reply written without a tool on this turn may restate what earlier tools returned, but
 * every sentence that makes a dataset claim must name a known finding or feature, and it may not
 * state counts, which only the tools' own answers report.
 */
export function assistantClaimsAreGrounded(text: string, known: KnownCitationIds): boolean {
  return splitSentences(text).every((sentence) => {
    if (!assistantStatesValidationResults(sentence)) return true;
    if (DATASET_CLAIMS[0]!.test(sentence.toLowerCase())) return false;
    return [...known.findingIds].some((id) => sentence.includes(id))
      || [...known.featureIds].some((id) => containsDelimited(sentence, id));
  });
}

export function refusalTextForMissingCitation(): string {
  return "I cannot state validation results without citing findingId, ruleId, or featureId from the tools. Please ask again after I fetch findings.";
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((sentence) => sentence.trim().length > 0);
}

/** A feature id counts only as a whole token, so feature "1" does not match "12". */
function containsDelimited(text: string, id: string): boolean {
  if (id.length === 0) return false;
  for (let index = text.indexOf(id); index >= 0; index = text.indexOf(id, index + 1)) {
    const before = text[index - 1] ?? " ";
    const after = text[index + id.length] ?? " ";
    if (!/[\w-]/.test(before) && !/[\w-]/.test(after)) return true;
  }
  return false;
}
