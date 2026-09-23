export const DATASET_LIMITS = {
  maxBytes: 1_048_576,
  maxFeatures: 500,
  maxPositionsPerRing: 10_000,
  maxPageSize: 100,
  defaultPageSize: 50,
} as const;

export const VECTOR_CORE_RULESET = {
  id: "vector-core",
  version: "1.0.0",
} as const;

export const QUALITY_LIMITATION =
  "These findings check ruleset vector-core 1.0.0 only. They are not a certification or guarantee of dataset quality.";

export const NON_WGS84_LIMITATION =
  "Source CRS is not EPSG:4326. Coordinates were not reprojected. Finding geometries were omitted so non-WGS84 coordinates are not presented as RFC 7946.";

export const RETENTION_POLICY =
  "Local validation runs stay in PostGIS until an operator deletes that run. There is no automatic purge or hosted retention.";
