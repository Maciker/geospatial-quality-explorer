import type { GeometryAssessment, GeometryEngine, GeometryInvalidReason } from "../domain/GeometryEngine.js";
import type { FeatureGeometry, Position } from "../domain/geometry.js";

export class PlanarPolygonEngine implements GeometryEngine {
  readonly name = "planar-polygon-engine";
  readonly version = "1.0.0";

  assess(geometry: FeatureGeometry): GeometryAssessment {
    if (geometry.kind === "empty") return { status: "empty" };
    if (geometry.kind === "unsupported") return { status: "unsupported", geometryType: geometry.geometryType };
    if (geometry.kind === "polygon") return assessPolygon(geometry.geometry.coordinates);
    for (const polygon of geometry.geometry.coordinates) {
      const assessment = assessPolygon(polygon);
      if (assessment.status !== "valid") return assessment;
    }
    return { status: "valid" };
  }
}

function assessPolygon(rings: readonly (readonly Position[])[]): GeometryAssessment {
  if (rings.length === 0) return { status: "empty" };
  const exterior = rings[0];
  if (!exterior) return { status: "invalid", reason: "missing-exterior" };
  const exteriorProblem = ringProblem(exterior);
  if (exteriorProblem) return { status: "invalid", reason: exteriorProblem };
  for (const hole of rings.slice(1)) {
    const holeProblem = ringProblem(hole);
    if (holeProblem) return { status: "invalid", reason: holeProblem };
    const probe = hole[0];
    if (!probe || !pointInRing(probe, exterior)) return { status: "invalid", reason: "hole-outside" };
    if (ringsCross(exterior, hole)) return { status: "invalid", reason: "hole-crosses-exterior" };
  }
  return { status: "valid" };
}

function ringProblem(ring: readonly Position[]): GeometryInvalidReason | null {
  if (ring.length < 4) return "ring-short";
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) return "ring-open";
  if (anySegmentsCross(ring, ring, true)) return "self-intersection";
  return null;
}

function ringsCross(exterior: readonly Position[], hole: readonly Position[]): boolean {
  return anySegmentsCross(exterior, hole, false);
}

function anySegmentsCross(leftRing: readonly Position[], rightRing: readonly Position[], skipAdjacent: boolean): boolean {
  const leftCount = leftRing.length - 1;
  const rightCount = rightRing.length - 1;
  for (let left = 0; left < leftCount; left += 1) {
    for (let right = 0; right < rightCount; right += 1) {
      if (skipAdjacent && (right === left || right === left + 1 || (left === 0 && right === leftCount - 1))) continue;
      const start = leftRing[left];
      const end = leftRing[left + 1];
      const otherStart = rightRing[right];
      const otherEnd = rightRing[right + 1];
      if (!start || !end || !otherStart || !otherEnd) continue;
      if (segmentsCross(start, end, otherStart, otherEnd)) return true;
    }
  }
  return false;
}

function segmentsCross(a: Position, b: Position, c: Position, d: Position): boolean {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  return first !== 0 && second !== 0 && third !== 0 && fourth !== 0 && first !== second && third !== fourth;
}

function orientation(start: Position, end: Position, probe: Position): number {
  const value = (end[0] - start[0]) * (probe[1] - start[1]) - (end[1] - start[1]) * (probe[0] - start[0]);
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

function pointInRing(point: Position, ring: readonly Position[]): boolean {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length - 1; previous = index, index += 1) {
    const current = ring[index];
    const prior = ring[previous];
    if (!current || !prior) continue;
    const crosses = (current[1] > point[1]) !== (prior[1] > point[1]);
    if (!crosses) continue;
    const edgeX = ((prior[0] - current[0]) * (point[1] - current[1])) / (prior[1] - current[1]) + current[0];
    if (point[0] < edgeX) inside = !inside;
  }
  return inside;
}
