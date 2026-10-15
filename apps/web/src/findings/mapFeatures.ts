import type { FindingFeature, GeoJsonGeometry } from "../lib/api";

export type SourceMapFeature = {
  readonly type: "Feature";
  readonly id: string;
  readonly geometry: GeoJsonGeometry;
  readonly properties: {
    readonly featureId: string;
    readonly name: string;
    readonly role: "source";
  };
};

export type FindingMapFeature = FindingFeature & {
  readonly properties: FindingFeature["properties"] & {
    readonly role: "finding-overlay";
    readonly hasGeometry: boolean;
  };
};

type FindingLike = {
  readonly findingId: string;
  readonly ruleId: string;
  readonly featureId: string;
  readonly severity: string;
  readonly explanation: string;
  readonly suggestedAction: string;
  readonly geometry: unknown;
};

/** MapLibre feature id must be the findingId so duplicate business ids do not collide. */
export function toFindingMapFeatures(findings: readonly FindingLike[]): FindingMapFeature[] {
  return findings.flatMap((finding) => {
    if (!isPolygonGeometry(finding.geometry)) return [];
    return [{
      type: "Feature",
      id: finding.findingId,
      geometry: finding.geometry,
      properties: {
        findingId: finding.findingId,
        ruleId: finding.ruleId,
        severity: finding.severity as FindingFeature["properties"]["severity"],
        featureId: finding.featureId,
        explanation: finding.explanation,
        suggestedAction: finding.suggestedAction,
        role: "finding-overlay",
        hasGeometry: true,
      },
    }];
  });
}

export function toSourceMapFeatures(collection: {
  readonly features: readonly unknown[];
}): SourceMapFeature[] {
  const features: SourceMapFeature[] = [];
  collection.features.forEach((raw, index) => {
    if (typeof raw !== "object" || raw === null) return;
    const feature = raw as {
      id?: string | number;
      properties?: Record<string, unknown>;
      geometry?: unknown;
    };
    if (!isPolygonGeometry(feature.geometry)) return;
    const businessId = typeof feature.id === "string" || typeof feature.id === "number"
      ? String(feature.id)
      : typeof feature.properties?.feature_id === "string"
        ? feature.properties.feature_id
        : `index:${index}`;
    const name = typeof feature.properties?.NAME === "string"
      ? feature.properties.NAME
      : typeof feature.properties?.name === "string"
        ? feature.properties.name
        : businessId;
    features.push({
      type: "Feature",
      id: `source:${businessId}:${index}`,
      geometry: feature.geometry,
      properties: {
        featureId: businessId,
        name,
        role: "source",
      },
    });
  });
  return features;
}

function isPolygonGeometry(value: unknown): value is GeoJsonGeometry {
  if (typeof value !== "object" || value === null) return false;
  const type = (value as { type?: string }).type;
  return type === "Polygon" || type === "MultiPolygon";
}
