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

const MAX_MAP_LATITUDE = 85.0511;

type LonLatBounds = {
  readonly west: number;
  readonly south: number;
  readonly east: number;
  readonly north: number;
};

/**
 * Prefer finding overlays for the initial fit so overseas territories in the
 * source layer (e.g. French Guiana on FRA) do not pull Europe out of frame.
 * When only the source layer is present, drop outlying multipolygon parts of features that
 * also have a part in mainland Europe (fit-only; source paint still shows full geometry).
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
  return sourceFeatures.map((feature) => ({
    geometry: clipOutlyingParts(feature.geometry),
  }));
}

/** True when the selected finding has a polygon overlay that is actually drawn on the map. */
export function hasSelectedOverlay(
  findingFeatures: readonly FindingMapFeature[],
  selectedFindingId: string | null,
): boolean {
  return selectedFindingId != null
    && findingFeatures.some((feature) => feature.properties.findingId === selectedFindingId);
}

/** Expand a selected-finding bbox so fitBounds keeps regional context (not only the bowtie edge). */
export function padBoundsForSelection(bounds: LonLatBounds, padDegrees: number): LonLatBounds {
  // LngLatBounds.extend throws for a latitude outside the Web Mercator range.
  return {
    west: bounds.west - padDegrees,
    south: Math.max(-MAX_MAP_LATITUDE, bounds.south - padDegrees),
    east: bounds.east + padDegrees,
    north: Math.min(MAX_MAP_LATITUDE, bounds.north + padDegrees),
  };
}

/**
 * Drops multipolygon parts outside the mainland envelope, but only for a feature that also has a part
 * inside it. A feature wholly outside (another continent, a synthetic fixture) keeps its full geometry,
 * so the fit never goes empty or loses non-European features.
 */
function clipOutlyingParts(geometry: GeoJsonGeometry): GeoJsonGeometry {
  if (geometry.type === "Polygon") return geometry;
  const kept = geometry.coordinates.filter((polygon) => polygonOverlapsMainland(polygon));
  if (kept.length === 0 || kept.length === geometry.coordinates.length) return geometry;
  if (kept.length === 1) return { type: "Polygon", coordinates: kept[0]! };
  return { type: "MultiPolygon", coordinates: kept };
}

/** Bounding-box overlap, so a polygon that encloses the envelope without a vertex inside still counts. */
function polygonOverlapsMainland(rings: readonly (readonly (readonly number[])[])[]): boolean {
  let west = Infinity;
  let south = Infinity;
  let east = -Infinity;
  let north = -Infinity;
  for (const ring of rings) {
    for (const position of ring) {
      const lon = position[0] ?? 0;
      const lat = position[1] ?? 0;
      west = Math.min(west, lon);
      east = Math.max(east, lon);
      south = Math.min(south, lat);
      north = Math.max(north, lat);
    }
  }
  return west <= MAINLAND_EUROPE_FIT.east
    && east >= MAINLAND_EUROPE_FIT.west
    && south <= MAINLAND_EUROPE_FIT.north
    && north >= MAINLAND_EUROPE_FIT.south;
}
