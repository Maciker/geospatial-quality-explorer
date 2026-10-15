import { describe, expect, it } from "vitest";
import {
  assistantClaimsAreGrounded,
  assistantStatesValidationResults,
  collectCitationIdsFromFindings,
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

  it("does not let a short feature id match inside another word", () => {
    expect(assistantClaimsAreGrounded("Feature 12 has an empty geometry.", knownWithFeature("1"))).toBe(false);
  });
});
