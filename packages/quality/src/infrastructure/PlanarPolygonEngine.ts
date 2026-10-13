import type { GeometryAssessment, GeometryEngine, GeometryInvalidReason } from "../domain/GeometryEngine.js";
import type { FeatureGeometry, Position } from "../domain/geometry.js";
import {
  orientation,
  pointOnRing,
  pointStrictlyInRing,
  ringSegments,
  ringsCrossProperly,
  samePosition,
  segmentsIntersect,
  twiceSignedArea,
  withoutRepeatedPositions,
} from "./planarPredicates.js";

type Rings = readonly (readonly Position[])[];

export class PlanarPolygonEngine implements GeometryEngine {
  readonly name = "planar-polygon-engine";
  readonly version = "1.1.0";

  assess(geometry: FeatureGeometry): GeometryAssessment {
    if (geometry.kind === "empty") return { status: "empty" };
    if (geometry.kind === "unsupported") return { status: "unsupported", geometryType: geometry.geometryType };
    if (geometry.kind === "polygon") return assessPolygon(geometry.geometry.coordinates);
    const parts = geometry.geometry.coordinates;
    for (const polygon of parts) {
      const assessment = assessPolygon(polygon);
      if (assessment.status !== "valid") return assessment;
    }
    if (anyPartsOverlap(parts)) return { status: "invalid", reason: "parts-overlap" };
    return { status: "valid" };
  }
}

function assessPolygon(rings: Rings): GeometryAssessment {
  if (rings.length === 0) return { status: "empty" };
  const exterior = rings[0];
  if (!exterior) return { status: "invalid", reason: "missing-exterior" };
  const exteriorProblem = ringProblem(exterior);
  if (exteriorProblem) return { status: "invalid", reason: exteriorProblem };
  const holes = rings.slice(1);
  for (const hole of holes) {
    const holeProblem = ringProblem(hole);
    if (holeProblem) return { status: "invalid", reason: holeProblem };
    const probe = hole.find((position) => !pointOnRing(position, exterior)) ?? hole[0];
    if (!probe || !pointStrictlyInRing(probe, exterior)) return { status: "invalid", reason: "hole-outside" };
    if (ringsCrossProperly(exterior, hole)) return { status: "invalid", reason: "hole-crosses-exterior" };
  }
  if (anyRingsOverlap(holes)) return { status: "invalid", reason: "holes-overlap" };
  return { status: "valid" };
}

function ringProblem(ring: readonly Position[]): GeometryInvalidReason | null {
  if (ring.length < 4) return "ring-short";
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last || !samePosition(first, last)) return "ring-open";
  const distinct = withoutRepeatedPositions(ring);
  if (distinct.length < 4 || twiceSignedArea(distinct) === 0) return "ring-degenerate";
  if (selfIntersects(distinct)) return "self-intersection";
  return null;
}

function selfIntersects(ring: readonly Position[]): boolean {
  const segments = ringSegments(ring);
  const last = segments.length - 1;
  for (let left = 0; left < segments.length; left += 1) {
    for (let right = left + 1; right < segments.length; right += 1) {
      const leftSegment = segments[left];
      const rightSegment = segments[right];
      if (!leftSegment || !rightSegment) continue;
      if (right === left + 1) {
        if (doublesBack(leftSegment[0], leftSegment[1], rightSegment[1])) return true;
      } else if (left === 0 && right === last) {
        if (doublesBack(leftSegment[1], leftSegment[0], rightSegment[0])) return true;
      } else if (segmentsIntersect(leftSegment[0], leftSegment[1], rightSegment[0], rightSegment[1])) {
        return true;
      }
    }
  }
  return false;
}

/** Adjacent segments overlap when the path turns back along the same line at the shared vertex. */
function doublesBack(before: Position, shared: Position, after: Position): boolean {
  if (orientation(before, shared, after) !== 0) return false;
  return (before[0] - shared[0]) * (after[0] - shared[0]) + (before[1] - shared[1]) * (after[1] - shared[1]) > 0;
}

function anyRingsOverlap(rings: Rings): boolean {
  for (let left = 0; left < rings.length; left += 1) {
    for (let right = left + 1; right < rings.length; right += 1) {
      const first = rings[left];
      const second = rings[right];
      if (!first || !second) continue;
      if (ringsCrossProperly(first, second)) return true;
      if (first.some((position) => pointStrictlyInRing(position, second))) return true;
      if (second.some((position) => pointStrictlyInRing(position, first))) return true;
      if (sameVertices(first, second)) return true;
    }
  }
  return false;
}

function anyPartsOverlap(parts: readonly Rings[]): boolean {
  for (let left = 0; left < parts.length; left += 1) {
    for (let right = left + 1; right < parts.length; right += 1) {
      const first = parts[left];
      const second = parts[right];
      const firstExterior = first?.[0];
      const secondExterior = second?.[0];
      if (!first || !second || !firstExterior || !secondExterior) continue;
      if (ringsCrossProperly(firstExterior, secondExterior)) return true;
      if (secondExterior.some((position) => pointStrictlyInPolygon(position, first))) return true;
      if (firstExterior.some((position) => pointStrictlyInPolygon(position, second))) return true;
      if (sameVertices(firstExterior, secondExterior)) return true;
    }
  }
  return false;
}

function pointStrictlyInPolygon(point: Position, rings: Rings): boolean {
  const [exterior, ...holes] = rings;
  if (!exterior || !pointStrictlyInRing(point, exterior)) return false;
  return holes.every((hole) => !pointOnRing(point, hole) && !pointStrictlyInRing(point, hole));
}

function sameVertices(left: readonly Position[], right: readonly Position[]): boolean {
  const key = (ring: readonly Position[]) => [...new Set(ring.map((position) => `${position[0]},${position[1]}`))].sort().join(";");
  return key(left) === key(right);
}
