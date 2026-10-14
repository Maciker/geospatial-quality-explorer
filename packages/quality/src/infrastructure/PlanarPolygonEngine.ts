import type { GeometryAssessment, GeometryEngine, GeometryInvalidReason } from "../domain/GeometryEngine.js";
import type { FeatureGeometry, Position } from "../domain/geometry.js";
import {
  boundarySamples,
  orientation,
  pointOnRing,
  pointStrictlyInRing,
  ringSegments,
  ringsCrossProperly,
  samePosition,
  segmentsIntersect,
  sharesBoundarySegment,
  touchPointCount,
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
    const holeProblemWithExterior = holeAgainstExterior(hole, exterior);
    if (holeProblemWithExterior) return { status: "invalid", reason: holeProblemWithExterior };
  }
  if (anyRingsOverlap(holes)) return { status: "invalid", reason: "holes-overlap" };
  return { status: "valid" };
}

function holeAgainstExterior(hole: readonly Position[], exterior: readonly Position[]): GeometryInvalidReason | null {
  if (ringsCrossProperly(exterior, hole)) return "hole-crosses-exterior";
  const samples = boundarySamples(hole, exterior);
  const outside = samples.some((position) => !pointOnRing(position, exterior) && !pointStrictlyInRing(position, exterior));
  if (outside || !samples.some((position) => pointStrictlyInRing(position, exterior))) return "hole-outside";
  if (sharesBoundarySegment(hole, exterior) || touchPointCount(hole, exterior) > 1) return "hole-touches-exterior";
  return null;
}

function ringProblem(ring: readonly Position[]): GeometryInvalidReason | null {
  if (ring.length < 4) return "ring-short";
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last || !samePosition(first, last)) return "ring-open";
  const distinct = withoutRepeatedPositions(ring);
  if (distinct.length < 4 || allCollinear(distinct)) return "ring-degenerate";
  if (selfIntersects(distinct)) return "self-intersection";
  return null;
}

/** A ring whose positions all lie on one line has zero area; a bowtie's signed area can also be zero, so area alone is not used. */
function allCollinear(ring: readonly Position[]): boolean {
  const [first, second] = ring;
  if (!first || !second) return true;
  return ring.every((position) => orientation(first, second, position) === 0);
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
  return anyPair(rings, (first, second) => ringsCrossProperly(first, second)
    || boundarySamples(first, second).some((position) => pointStrictlyInRing(position, second))
    || boundarySamples(second, first).some((position) => pointStrictlyInRing(position, first))
    || sharesBoundarySegment(first, second));
}

/** OGC MultiPolygon parts may touch only at points: overlapping interiors and shared edges are invalid. */
function anyPartsOverlap(parts: readonly Rings[]): boolean {
  return anyPair(parts, (first, second) => {
    const firstExterior = first[0];
    const secondExterior = second[0];
    if (!firstExterior || !secondExterior) return false;
    return ringsCrossProperly(firstExterior, secondExterior)
      || boundarySamples(secondExterior, firstExterior).some((position) => pointStrictlyInPolygon(position, first))
      || boundarySamples(firstExterior, secondExterior).some((position) => pointStrictlyInPolygon(position, second))
      || sharesBoundarySegment(firstExterior, secondExterior);
  });
}

function anyPair<T>(items: readonly T[], test: (first: T, second: T) => boolean): boolean {
  for (let left = 0; left < items.length; left += 1) {
    for (let right = left + 1; right < items.length; right += 1) {
      const first = items[left];
      const second = items[right];
      if (first !== undefined && second !== undefined && test(first, second)) return true;
    }
  }
  return false;
}

function pointStrictlyInPolygon(point: Position, rings: Rings): boolean {
  const [exterior, ...holes] = rings;
  if (!exterior || !pointStrictlyInRing(point, exterior)) return false;
  return holes.every((hole) => !pointOnRing(point, hole) && !pointStrictlyInRing(point, hole));
}
