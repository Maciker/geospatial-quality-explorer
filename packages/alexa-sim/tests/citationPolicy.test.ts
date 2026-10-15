import { describe, expect, it } from "vitest";
import {
  assistantClaimsAreGrounded,
  assistantStatesValidationResults,
  collectCitationIdsFromFindings,
  mergeCitationIds,
  refusalTextForMissingCitation,
} from "../src/application/citationPolicy.js";

const FINDING_ID = `${"a".repeat(64)}:1:geometry.self_intersection`;

function knownWithFeature(featureId: string) {
  return collectCitationIdsFromFindings([
    {
      findingId: FINDING_ID,
      ruleId: "geometry.self_intersection",
      featureId,
    },
  ]);
}

describe("citationPolicy", () => {
  it.each([
    "Hello! I can validate the portfolio fixture, list findings, explain one, or export QGIS.",
    "The QGIS export is ready. Download the bundle from the simulation panel.",
    "Which finding id should I explain next?",
    "Please give the feature id first.",
    "A self-intersection is when a polygon boundary crosses itself.",
    "I cannot repair invalid geometry. That is out of scope for this simulation.",
    "No problem! Ask me to validate the portfolio fixture.",
    "Sure, no problem.",
    "I can explain one finding at a time.",
    "I can list some features of the portfolio.",
    "Do you want me to list one finding or two?",
    "Ask me for the top 3 findings.",
    "I can show up to 5 findings.",
    "Validation checks for duplicates, overlaps and self-intersections.",
    refusalTextForMissingCitation(),
  ])("does not treat a neutral reply as a dataset claim: %s", (text) => {
    expect(assistantStatesValidationResults(text)).toBe(false);
  });

  it.each([
    "Parcel-7 self-intersects and must be fixed.",
    "There is one duplicate id problem in the dataset.",
    "The dataset has three invalid polygons.",
    "Feature A12 has an empty geometry.",
    "Everything looks clean, no problems at all.",
    "I cannot repair it, but Parcel-7 self-intersects.",
    "Simulation result: 4 critical geometry errors; the QGIS bundle is ready to download.",
    "This dataset has a severe geometry error that you must fix immediately.",
    "Looks good, the data is all fine.",
    "That is out of scope, but the polygon is invalid.",
    "Feature empty-1 and cats-9 are broken.",
    "No errors were found.",
    "Seven issues exist.",
    "Two features overlap.",
    "Dozens of issues were reported.",
    "Only a handful of problems remain.",
    "I found nothing wrong.",
    "Twelve errors were found.",
    "Twenty issues exist.",
    "A couple of issues were found.",
    "I can see seven issues in the data.",
    "Let me be clear: no errors were found.",
    "I did not find any errors.",
    "I didn't find any issues.",
    "I could not find any problems.",
    "Nothing is wrong with the data.",
    "Feature bowtie-1 overlaps parcel-2.",
  ])("treats an invented quality claim as a validation result: %s", (text) => {
    expect(assistantStatesValidationResults(text)).toBe(true);
  });

  it.each(["parcel A", "urn:x:1", "lot 4."])("accepts a claim that cites a known finding on feature %s", (featureId) => {
    const text = `findingId ${FINDING_ID} (geometry.self_intersection, high) on featureId ${featureId}: The ring crosses itself.`;

    expect(assistantClaimsAreGrounded(text, knownWithFeature(featureId))).toBe(true);
  });

  it.each([
    `Validation finished. runId run-1. 7 self-intersecting polygons and 3 duplicates. See ${FINDING_ID}.`,
    `findingId ${FINDING_ID} on featureId f. Also feature 12 has a self-intersection.`,
    `Feature empty-1 and cats-9 are broken. See ${FINDING_ID}.`,
  ])("rejects an invented claim beside a real id: %s", (text) => {
    expect(assistantClaimsAreGrounded(text, knownWithFeature("f"))).toBe(false);
  });

  it.each([
    "Feature bowtie-1 has a self-intersection.",
    "The finding on bowtie-1 is a geometry.invalid error.",
    `Feature P-12 has a self-intersection (finding ${FINDING_ID}).`,
  ])("does not read digits inside a known id as a count: %s", (text) => {
    const known = mergeCitationIds(knownWithFeature("bowtie-1"), knownWithFeature("P-12"));

    expect(assistantClaimsAreGrounded(text, known)).toBe(true);
    expect(assistantClaimsAreGrounded("There are 5 findings on bowtie-1.", known)).toBe(false);
  });

  it.each([
    "There are 3 errors yet to fix.",
    "The portfolio has 5 findings, but I can't tell which are severe.",
  ])("does not let a hedge excuse an invented count: %s", (text) => {
    expect(assistantClaimsAreGrounded(text, knownWithFeature("f"))).toBe(false);
  });

  it("accepts a restated empty geometry on a known feature", () => {
    expect(assistantClaimsAreGrounded("The previous finding was on featureId empty-1 and says the feature has no geometry.", knownWithFeature("empty-1"))).toBe(true);
  });

  it.each([
    "There are no findings yet. Ask me to validate the portfolio.",
    "I have no errors to report because I haven't run validation.",
    "Sorry, I can't tell which feature has the error.",
  ])("lets an empty-state or hedged reply through: %s", (text) => {
    expect(assistantClaimsAreGrounded(text, knownWithFeature("f"))).toBe(true);
  });

  it("does not let a short feature id match inside another word", () => {
    expect(assistantClaimsAreGrounded("Feature 12 has an empty geometry.", knownWithFeature("1"))).toBe(false);
  });
});
