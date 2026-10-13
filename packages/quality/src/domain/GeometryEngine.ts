import type { FeatureGeometry } from "./geometry.js";

export type GeometryAssessment =
  | { readonly status: "empty" }
  | { readonly status: "unsupported"; readonly geometryType: string }
  | { readonly status: "invalid"; readonly reason: GeometryInvalidReason }
  | { readonly status: "valid" };

export type GeometryInvalidReason =
  | "missing-exterior"
  | "ring-open"
  | "ring-short"
  | "self-intersection"
  | "hole-outside"
  | "hole-crosses-exterior"
  | "ring-degenerate"
  | "holes-overlap"
  | "parts-overlap";

export interface GeometryEngine {
  readonly name: string;
  readonly version: string;
  assess(geometry: FeatureGeometry): GeometryAssessment;
}
