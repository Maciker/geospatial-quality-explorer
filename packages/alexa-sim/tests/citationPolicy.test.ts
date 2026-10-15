import { describe, expect, it } from "vitest";
import {
  assistantReplyExemptFromCitationGuard,
  assistantStatesValidationResults,
  collectCitationIdsFromFindings,
} from "../src/application/citationPolicy.js";

describe("citationPolicy", () => {
  it("does not guard a plain export confirmation, but guards one that adds uncited findings", () => {
    expect(assistantStatesValidationResults("The QGIS export is ready. Download the bundle from the simulation panel.")).toBe(false);
    expect(assistantStatesValidationResults("Simulation result: 4 critical geometry errors; the QGIS bundle is ready to download.")).toBe(true);
    expect(assistantReplyExemptFromCitationGuard("Simulation result: 4 critical geometry errors; the QGIS bundle is ready to download.")).toBe(false);
  });

  it.each([
    "Parcel-7 self-intersects and must be fixed.",
    "There is one duplicate id problem in the dataset.",
    "The dataset has three invalid polygons.",
    "Feature A12 has an empty geometry.",
    "Everything looks clean, no problems at all.",
    "I cannot repair it, but Parcel-7 self-intersects.",
  ])("treats an invented quality claim as a validation result: %s", (text) => {
    expect(assistantStatesValidationResults(text)).toBe(true);
  });

  it("treats out-of-scope refusals as exempt", () => {
    expect(assistantReplyExemptFromCitationGuard("I cannot repair invalid geometry. That is out of scope for this simulation.")).toBe(true);
    expect(assistantStatesValidationResults("I cannot repair invalid geometry. That is out of scope for this simulation.")).toBe(false);
  });

  it("still requires citations for uncited validation claims", () => {
    expect(assistantStatesValidationResults("This dataset has a severe geometry error that you must fix immediately.")).toBe(true);
    expect(assistantReplyExemptFromCitationGuard("This dataset has a severe geometry error that you must fix immediately.")).toBe(false);
  });

  it("detects when a reply already cites a known finding id", () => {
    const known = collectCitationIdsFromFindings([
      {
        findingId: `${"a".repeat(64)}:1:geometry.empty`,
        ruleId: "geometry.empty",
        featureId: "feature-1",
        severity: "high",
        explanation: "Empty geometry.",
        suggestedAction: "Review the feature.",
        geometry: null,
      },
    ]);
    const text = `findingId ${"a".repeat(64)}:1:geometry.empty is the top issue.`;
    expect(assistantStatesValidationResults(text)).toBe(true);
    expect([...known.findingIds].some((id) => text.includes(id))).toBe(true);
  });
});
