import { DomainError } from "../domain/DomainError.js";
import { DATASET_LIMITS } from "../domain/limits.js";
import type { DatasetFeature, FeatureGeometry, PolygonGeometry, Position } from "../domain/geometry.js";

const CRS_PATTERN = /^EPSG:[0-9]{4,6}$/;

export type DatasetDeclaration = {
  readonly name: string;
  readonly sourceCrs: string;
  readonly license: string;
  readonly parameters: Readonly<Record<string, string>>;
};

export function assertDeclaration(declaration: DatasetDeclaration): void {
  if (declaration.name.trim() === "") throw DomainError.createValidation("dataset.name: A dataset name is required.");
  if (declaration.license.trim() === "") throw DomainError.createValidation("dataset.license: A license reference is required.");
  if (!CRS_PATTERN.test(declaration.sourceCrs)) {
    throw DomainError.createValidation("dataset.source_crs: Source CRS must be an explicit EPSG code such as EPSG:4326. It is never inferred.");
  }
}

export function parseFeatureCollection(input: unknown, byteLength: number): DatasetFeature[] {
  if (byteLength > DATASET_LIMITS.maxBytes) {
    throw DomainError.createValidation(`dataset.too_large: Datasets are limited to ${DATASET_LIMITS.maxBytes} bytes.`);
  }
  if (!isRecord(input) || input.type !== "FeatureCollection" || !Array.isArray(input.features)) {
    throw DomainError.createValidation("dataset.not_feature_collection: Input must be a GeoJSON FeatureCollection.");
  }
  if ("crs" in input) {
    throw DomainError.createValidation("dataset.crs_member: GeoJSON crs members are not accepted. Pass source CRS separately.");
  }
  if (input.features.length > DATASET_LIMITS.maxFeatures) {
    throw DomainError.createValidation(`dataset.too_many_features: Datasets are limited to ${DATASET_LIMITS.maxFeatures} features.`);
  }
  return input.features.map((feature, featureIndex) => parseFeature(feature, featureIndex));
}

function parseFeature(feature: unknown, featureIndex: number): DatasetFeature {
  if (!isRecord(feature) || feature.type !== "Feature") {
    throw DomainError.createValidation(`feature.invalid: Feature ${featureIndex} must be a GeoJSON Feature.`);
  }
  if ("crs" in feature) {
    throw DomainError.createValidation("dataset.crs_member: GeoJSON crs members are not accepted. Pass source CRS separately.");
  }
  return {
    featureIndex,
    featureId: readFeatureId(feature),
    geometry: parseGeometry(feature.geometry, featureIndex),
  };
}

function readFeatureId(feature: Record<string, unknown>): string | null {
  const direct = identifierText(feature.id);
  if (direct !== null) return direct;
  if (!isRecord(feature.properties)) return null;
  return identifierText(feature.properties.feature_id);
}

function identifierText(value: unknown): string | null {
  if (typeof value === "string" && value.trim() !== "") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function parseGeometry(geometry: unknown, featureIndex: number): FeatureGeometry {
  if (geometry === null || geometry === undefined) return { kind: "empty" };
  if (!isRecord(geometry) || typeof geometry.type !== "string") {
    throw DomainError.createValidation(`feature.invalid: Feature ${featureIndex} has a malformed geometry.`);
  }
  if (geometry.type === "Polygon") return { kind: "polygon", geometry: { type: "Polygon", coordinates: parsePolygon(geometry.coordinates, featureIndex) } };
  if (geometry.type === "MultiPolygon") {
    if (!Array.isArray(geometry.coordinates)) {
      throw DomainError.createValidation(`feature.invalid: Feature ${featureIndex} has a malformed geometry.`);
    }
    if (geometry.coordinates.length === 0) return { kind: "empty" };
    return {
      kind: "multipolygon",
      geometry: {
        type: "MultiPolygon",
        coordinates: geometry.coordinates.map((polygon) => parsePolygon(polygon, featureIndex)),
      },
    };
  }
  return { kind: "unsupported", geometryType: geometry.type };
}

function parsePolygon(value: unknown, featureIndex: number): PolygonGeometry["coordinates"] {
  if (!Array.isArray(value)) {
    throw DomainError.createValidation(`feature.invalid: Feature ${featureIndex} has a malformed geometry.`);
  }
  return value.map((ring) => parseRing(ring, featureIndex));
}

function parseRing(value: unknown, featureIndex: number): readonly Position[] {
  if (!Array.isArray(value)) {
    throw DomainError.createValidation(`feature.invalid: Feature ${featureIndex} has a malformed geometry.`);
  }
  if (value.length > DATASET_LIMITS.maxPositionsPerRing) {
    throw DomainError.createValidation(`dataset.too_many_positions: Rings are limited to ${DATASET_LIMITS.maxPositionsPerRing} positions.`);
  }
  return value.map((position) => parsePosition(position, featureIndex));
}

function parsePosition(value: unknown, featureIndex: number): Position {
  if (!Array.isArray(value) || value.length !== 2) {
    throw DomainError.createValidation(`position.invalid: Feature ${featureIndex} has a position that is not a longitude and latitude pair. 3D coordinates are unsupported.`);
  }
  const longitude = value[0];
  const latitude = value[1];
  if (typeof longitude !== "number" || typeof latitude !== "number" || !Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw DomainError.createValidation(`position.invalid: Feature ${featureIndex} has a non-numeric position.`);
  }
  return [longitude, latitude];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
