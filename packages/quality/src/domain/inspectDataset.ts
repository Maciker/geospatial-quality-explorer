import type { GeometryEngine } from "./GeometryEngine.js";
import type { DatasetFeature, Finding, GeoJsonGeometry } from "./geometry.js";

const SUGGESTED_ACTION: Record<string, string> = {
  "geometry.empty": "Provide a Polygon or MultiPolygon, or remove the feature. Source data was not modified.",
  "geometry.invalid": "Repair the polygon in a desktop GIS tool. Source data was not modified.",
  "geometry.unsupported": "Convert the geometry to Polygon or MultiPolygon. Source data was not modified.",
  "identifier.duplicate": "Assign a unique feature id. Source data was not modified.",
  "identifier.missing": "Set Feature.id or properties.feature_id. Source data was not modified.",
};

const INVALID_EXPLANATION: Record<string, string> = {
  "missing-exterior": "The polygon has no exterior ring.",
  "ring-open": "A ring is not closed.",
  "ring-short": "A ring has fewer than four positions.",
  "self-intersection": "A ring self-intersects.",
  "hole-outside": "A hole lies outside its exterior ring.",
  "hole-crosses-exterior": "A hole crosses its exterior ring.",
};

export function inspectDataset(
  features: readonly DatasetFeature[],
  engine: GeometryEngine,
  geometryPolicy: "include" | "omit",
  runId: string,
): Finding[] {
  const counts = new Map<string, number>();
  for (const feature of features) {
    if (feature.featureId === null) continue;
    counts.set(feature.featureId, (counts.get(feature.featureId) ?? 0) + 1);
  }
  const findings: Finding[] = [];
  for (const feature of features) {
    const featureId = feature.featureId ?? `index:${feature.featureIndex}`;
    if (feature.featureId === null) {
      findings.push(finding(runId, feature, featureId, "identifier.missing", "The feature has no feature id.", null));
    } else if ((counts.get(feature.featureId) ?? 0) > 1) {
      findings.push(finding(
        runId,
        feature,
        featureId,
        "identifier.duplicate",
        `Feature id ${feature.featureId} is used more than once.`,
        null,
      ));
    }
    const assessment = engine.assess(feature.geometry);
    if (assessment.status === "empty") {
      findings.push(finding(runId, feature, featureId, "geometry.empty", "The feature has no geometry.", null));
    } else if (assessment.status === "unsupported") {
      findings.push(finding(
        runId,
        feature,
        featureId,
        "geometry.unsupported",
        `The geometry type ${assessment.geometryType} is unsupported.`,
        null,
      ));
    } else if (assessment.status === "invalid") {
      const geometry = geometryPolicy === "include" ? storedGeometry(feature) : null;
      findings.push(finding(
        runId,
        feature,
        featureId,
        "geometry.invalid",
        INVALID_EXPLANATION[assessment.reason] ?? "The geometry is invalid.",
        geometry,
      ));
    }
  }
  return findings.sort((left, right) => {
    if (left.featureIndex !== right.featureIndex) return left.featureIndex - right.featureIndex;
    if (left.ruleId !== right.ruleId) return left.ruleId < right.ruleId ? -1 : 1;
    return left.findingId < right.findingId ? -1 : 1;
  });
}

function storedGeometry(feature: DatasetFeature): GeoJsonGeometry | null {
  if (feature.geometry.kind === "polygon" || feature.geometry.kind === "multipolygon") {
    return feature.geometry.geometry;
  }
  return null;
}

function finding(
  runId: string,
  feature: DatasetFeature,
  featureId: string,
  ruleId: string,
  explanation: string,
  geometry: GeoJsonGeometry | null,
): Finding {
  return {
    findingId: `${runId}:${feature.featureIndex}:${ruleId}`,
    ruleId,
    severity: "error",
    featureId,
    featureIndex: feature.featureIndex,
    explanation,
    suggestedAction: SUGGESTED_ACTION[ruleId] ?? "Review the feature. Source data was not modified.",
    geometry,
  };
}
