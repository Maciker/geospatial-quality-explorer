import { describe, expect, it } from "vitest";
import {
  assistantReplyExemptFromCitationGuard,
  assistantStatesValidationResults,
  collectCitationIdsFromFindings,
} from "../src/application/citationPolicy.js";

describe("citationPolicy", () => {
  it("treats export-ready replies as exempt from the citation guard", () => {
    expect(assistantReplyExemptFromCitationGuard("The QGIS export is ready. Download the bundle from the simulation panel.")).toBe(true);
    expect(assistantStatesValidationResults("Your validation findings are in the QGIS bundle. Download from the panel.")).toBe(false);
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
