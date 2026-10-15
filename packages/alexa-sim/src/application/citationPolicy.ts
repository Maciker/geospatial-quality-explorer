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

const NUMBER_WORD = String.raw`(?:one|two|three|four|five|six|seven|eight|nine|ten|several|many|some)`;
const PROBLEM_NOUNS = String.raw`findings?|issues?|errors?|warnings?|problems?|defects?|duplicates?|self-intersections?|overlaps?`;
const PROBLEM_NOUN = `(?:${PROBLEM_NOUNS})`;
const DEFECT_NOUN = String.raw`(?:${PROBLEM_NOUNS}|polygons?|features?|geometr(?:y|ies))`;
/** A word count is stated only after a verb: "has three", not "explain one finding at a time". */
const STATING_VERB = String.raw`\b(?:has|have|had|found|finds|is|are|was|were|contains?|detected|returned|reports?|shows?|with)\s+(?:only\s+|just\s+)?`;

/** "7 errors", "has three invalid polygons": a count only the tools may report. */
const POSITIVE_COUNT = [
  new RegExp(String.raw`(?<![\w:.-])\d+\s+(?:[\w-]+\s+){0,2}${DEFECT_NOUN}\b`),
  new RegExp(String.raw`${STATING_VERB}${NUMBER_WORD}\s+(?:[\w-]+\s+){0,2}${DEFECT_NOUN}\b`),
];
/** "found no problems": a clean verdict. "has no geometry" restates a finding and is not a count. */
const ZERO_COUNT = new RegExp(String.raw`${STATING_VERB}(?:no|zero)\s+(?:[\w-]+\s+){0,2}${PROBLEM_NOUN}\b`);

/**
 * Assertions about this dataset: counts, a feature or dataset said to have a defect, or a verdict
 * such as "the data is fine". Capability text, questions and definitions are not claims.
 */
const DATASET_CLAIMS: readonly RegExp[] = [
  ...POSITIVE_COUNT,
  ZERO_COUNT,
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
    // Ids are quoted, not asserted: "bowtie-1" must not read as a count of one.
    const claim = withoutKnownIds(sentence, known);
    const lowered = claim.toLowerCase();
    if (!assistantStatesValidationResults(claim)) return true;
    if (POSITIVE_COUNT.some((pattern) => pattern.test(lowered))) return false;
    if (HEDGE.test(lowered)) return true;
    if (ZERO_COUNT.test(lowered)) return false;
    return claim !== sentence;
  });
}

/** "Not validated yet", "I can't tell": the model declines to state a result. */
const HEDGE = /\b(?:yet|haven't|have not|hasn't|has not|not (?:been )?(?:run|validated)|can't tell|cannot tell|don't know|do not know)\b/;

function withoutKnownIds(sentence: string, known: KnownCitationIds): string {
  let scrubbed = sentence;
  for (const id of known.findingIds) scrubbed = scrubbed.split(id).join("ID");
  // An id equal to the placeholder would never stop matching.
  const featureIds = [...known.featureIds].filter((id) => id.length > 0 && id !== "ID").sort((left, right) => right.length - left.length);
  for (const id of featureIds) {
    while (containsDelimited(scrubbed, id)) scrubbed = replaceDelimited(scrubbed, id);
  }
  return scrubbed;
}

export function refusalTextForMissingCitation(): string {
  return "I cannot state validation results without citing findingId, ruleId, or featureId from the tools. Please ask again after I fetch findings.";
}

function splitSentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+(?=[A-Z])/).filter((sentence) => sentence.trim().length > 0);
}

/** A feature id counts only as a whole token, so feature "1" does not match "12". */
function containsDelimited(text: string, id: string): boolean {
  return delimitedIndex(text, id) >= 0;
}

function replaceDelimited(text: string, id: string): string {
  const index = delimitedIndex(text, id);
  return `${text.slice(0, index)}ID${text.slice(index + id.length)}`;
}

function delimitedIndex(text: string, id: string): number {
  if (id.length === 0) return -1;
  for (let index = text.indexOf(id); index >= 0; index = text.indexOf(id, index + 1)) {
    const before = text[index - 1] ?? " ";
    const after = text[index + id.length] ?? " ";
    if (!/[\w-]/.test(before) && !/[\w-]/.test(after)) return index;
  }
  return -1;
}
