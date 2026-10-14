import type { Position } from "../domain/geometry.js";

export function orientation(start: Position, end: Position, probe: Position): number {
  const value = (end[0] - start[0]) * (probe[1] - start[1]) - (end[1] - start[1]) * (probe[0] - start[0]);
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

export function samePosition(left: Position, right: Position): boolean {
  return left[0] === right[0] && left[1] === right[1];
}

function pointOnSegment(point: Position, start: Position, end: Position): boolean {
  if (orientation(start, end, point) !== 0) return false;
  return point[0] >= Math.min(start[0], end[0]) && point[0] <= Math.max(start[0], end[0])
    && point[1] >= Math.min(start[1], end[1]) && point[1] <= Math.max(start[1], end[1]);
}

/** Proper crossing: the segments cross at a single point interior to both. */
function segmentsCrossProperly(a: Position, b: Position, c: Position, d: Position): boolean {
  const first = orientation(a, b, c);
  const second = orientation(a, b, d);
  const third = orientation(c, d, a);
  const fourth = orientation(c, d, b);
  return first !== 0 && second !== 0 && third !== 0 && fourth !== 0 && first !== second && third !== fourth;
}

/** Closed-segment intersection, including touching endpoints and collinear overlap. */
export function segmentsIntersect(a: Position, b: Position, c: Position, d: Position): boolean {
  if (segmentsCrossProperly(a, b, c, d)) return true;
  return pointOnSegment(c, a, b) || pointOnSegment(d, a, b) || pointOnSegment(a, c, d) || pointOnSegment(b, c, d);
}

export function ringSegments(ring: readonly Position[]): Array<readonly [Position, Position]> {
  const segments: Array<readonly [Position, Position]> = [];
  for (let index = 0; index < ring.length - 1; index += 1) {
    const start = ring[index];
    const end = ring[index + 1];
    if (start && end) segments.push([start, end]);
  }
  return segments;
}

export function pointOnRing(point: Position, ring: readonly Position[]): boolean {
  return ringSegments(ring).some(([start, end]) => pointOnSegment(point, start, end));
}

/** Even-odd test; the result is unspecified for points on the boundary. */
function pointInRing(point: Position, ring: readonly Position[]): boolean {
  let inside = false;
  for (const [prior, current] of ringSegments(ring)) {
    const crosses = (current[1] > point[1]) !== (prior[1] > point[1]);
    if (!crosses) continue;
    const edgeX = ((prior[0] - current[0]) * (point[1] - current[1])) / (prior[1] - current[1]) + current[0];
    if (point[0] < edgeX) inside = !inside;
  }
  return inside;
}

export function pointStrictlyInRing(point: Position, ring: readonly Position[]): boolean {
  return !pointOnRing(point, ring) && pointInRing(point, ring);
}

export function withoutRepeatedPositions(ring: readonly Position[]): Position[] {
  const kept: Position[] = [];
  for (const position of ring) {
    const previous = kept[kept.length - 1];
    if (!previous || !samePosition(previous, position)) kept.push(position);
  }
  return kept;
}

function midpoint(start: Position, end: Position): Position {
  return [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
}

/** Edges of `ring` split at every vertex of `other` lying on them, so each piece is wholly inside, outside or on `other`. */
function splitSegments(ring: readonly Position[], other: readonly Position[]): Array<readonly [Position, Position]> {
  const pieces: Array<readonly [Position, Position]> = [];
  for (const [start, end] of ringSegments(ring)) {
    const length = Math.abs(end[0] - start[0]) + Math.abs(end[1] - start[1]);
    const cuts = other
      .filter((position) => pointOnSegment(position, start, end))
      .map((position) => (Math.abs(position[0] - start[0]) + Math.abs(position[1] - start[1])) / length);
    const params = [...new Set([0, ...cuts, 1])].sort((left, right) => left - right);
    for (let index = 0; index < params.length - 1; index += 1) {
      const from = params[index] ?? 0;
      const to = params[index + 1] ?? 1;
      pieces.push([
        [start[0] + (end[0] - start[0]) * from, start[1] + (end[1] - start[1]) * from],
        [start[0] + (end[0] - start[0]) * to, start[1] + (end[1] - start[1]) * to],
      ]);
    }
  }
  return pieces;
}

/** Vertices plus the midpoint of every split piece: enough to tell where `ring`'s boundary runs relative to `other`. */
export function boundarySamples(ring: readonly Position[], other: readonly Position[]): Position[] {
  return [...ring, ...splitSegments(ring, other).map(([start, end]) => midpoint(start, end))];
}

/** True when the two rings share a boundary stretch of positive length. */
export function sharesBoundarySegment(left: readonly Position[], right: readonly Position[]): boolean {
  return splitSegments(left, right).some(([start, end]) => pointOnRing(midpoint(start, end), right));
}

/** Distinct points where the rings touch without crossing; only valid when there are no proper crossings. */
export function touchPointCount(left: readonly Position[], right: readonly Position[]): number {
  const touches = [
    ...left.filter((position) => pointOnRing(position, right)),
    ...right.filter((position) => pointOnRing(position, left)),
  ];
  return new Set(touches.map((position) => `${position[0]},${position[1]}`)).size;
}

export function ringsCrossProperly(left: readonly Position[], right: readonly Position[]): boolean {
  const rightSegments = ringSegments(right);
  return ringSegments(left).some(([a, b]) => rightSegments.some(([c, d]) => segmentsCrossProperly(a, b, c, d)));
}
