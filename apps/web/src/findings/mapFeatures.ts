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

/** Mainland / near-Europe envelope used only for map framing (display GeoJSON stays intact). */
const MAINLAND_EUROPE_FIT = {
  west: -25,
  south: 34,
  east: 35,
  north: 72,
} as const;

type LonLatBounds = {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
};

/**
 * Prefer finding overlays for the initial fit so overseas territories in the
 * source layer (e.g. French Guiana on FRA) do not pull Europe out of frame.
 * When only the source layer is present, drop multipolygon parts outside the
 * mainland-Europe envelope (fit-only; source paint still shows full geometry).
 */
export function featuresForFit(
  sourceFeatures: readonly SourceMapFeature[],
  findingFeatures: readonly FindingMapFeature[],
  selectedFindingId: string | null,
): readonly { readonly geometry: GeoJsonGeometry | null }[] {
  if (selectedFindingId) {
    const selected = findingFeatures.find((feature) => feature.properties.findingId === selectedFindingId);
    if (selected) return [selected];
  }
  if (findingFeatures.length > 0) return findingFeatures;
  const clipped = sourceFeatures.map((feature) => ({
    geometry: clipGeometryToMainlandFit(feature.geometry),
  }));
  // Synthetic fixtures sit outside Europe: clipping everything would leave no framing at all.
  return clipped.some((feature) => feature.geometry !== null)
    ? clipped
    : sourceFeatures.map((feature) => ({ geometry: feature.geometry }));
}

/** Expand a selected-finding bbox so fitBounds keeps regional context (not only the bowtie edge). */
export function padBoundsForSelection(bounds: LonLatBounds, padDegrees: number): LonLatBounds {
  return {
    west: bounds.west - padDegrees,
    south: bounds.south - padDegrees,
    east: bounds.east + padDegrees,
    north: bounds.north + padDegrees,
  };
}

function clipGeometryToMainlandFit(geometry: GeoJsonGeometry): GeoJsonGeometry | null {
  if (geometry.type === "Polygon") {
    return polygonIntersectsMainland(geometry.coordinates) ? geometry : null;
  }
  const kept = geometry.coordinates.filter((polygon) => polygonIntersectsMainland(polygon));
  if (kept.length === 0) return null;
  if (kept.length === 1) return { type: "Polygon", coordinates: kept[0]! };
  return { type: "MultiPolygon", coordinates: kept };
}

function polygonIntersectsMainland(rings: readonly (readonly (readonly number[])[])[]): boolean {
  for (const ring of rings) {
    for (const position of ring) {
      const lon = position[0] ?? 0;
      const lat = position[1] ?? 0;
      if (
        lon >= MAINLAND_EUROPE_FIT.west
        && lon <= MAINLAND_EUROPE_FIT.east
        && lat >= MAINLAND_EUROPE_FIT.south
        && lat <= MAINLAND_EUROPE_FIT.north
      ) {
        return true;
      }
    }
  }
  return false;
}
