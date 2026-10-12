import { describe, expect, it } from "vitest";
import type { Finding } from "../../../quality/src/domain/geometry.js";
import { pagePrioritizedFindings, prioritizeFindings } from "./prioritizeFindings.js";

function sampleFinding(partial: Partial<Finding> & Pick<Finding, "findingId" | "severity" | "featureIndex" | "ruleId">): Finding {
  return {
    featureId: "f-1",
    explanation: "sample",
    suggestedAction: "sample",
    geometry: null,
    ...partial,
  };
}

describe("prioritizeFindings", () => {
  it("orders severities before feature index", () => {
    const findings = [
      sampleFinding({ findingId: "a", severity: "info", featureIndex: 0, ruleId: "geometry.empty" }),
      sampleFinding({ findingId: "b", severity: "error", featureIndex: 5, ruleId: "geometry.invalid" }),
      sampleFinding({ findingId: "c", severity: "warning", featureIndex: 1, ruleId: "identifier.missing" }),
    ];
    const ordered = prioritizeFindings(findings);
    expect(ordered.map((finding) => finding.severity)).toEqual(["error", "warning", "info"]);
  });

  it("pages prioritized findings with cursors", () => {
    const findings = [
      sampleFinding({ findingId: "1", severity: "error", featureIndex: 0, ruleId: "a" }),
      sampleFinding({ findingId: "2", severity: "error", featureIndex: 1, ruleId: "a" }),
    ];
    const first = pagePrioritizedFindings(findings, 1, null);
    expect(first.findings).toHaveLength(1);
    expect(first.findings[0]?.findingId).toBe("1");
    expect(first.nextCursor).not.toBeNull();
    const second = pagePrioritizedFindings(findings, 1, first.nextCursor);
    expect(second.findings[0]?.findingId).toBe("2");
    expect(second.nextCursor).toBeNull();
  });
});
