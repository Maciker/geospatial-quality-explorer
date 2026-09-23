export type Position = readonly [number, number];

export type PolygonGeometry = {
  readonly type: "Polygon";
  readonly coordinates: readonly (readonly Position[])[];
};

export type MultiPolygonGeometry = {
  readonly type: "MultiPolygon";
  readonly coordinates: readonly (readonly (readonly Position[])[])[];
};

export type GeoJsonGeometry = PolygonGeometry | MultiPolygonGeometry;

export type FeatureGeometry =
  | { readonly kind: "empty" }
  | { readonly kind: "unsupported"; readonly geometryType: string }
  | { readonly kind: "polygon"; readonly geometry: PolygonGeometry }
  | { readonly kind: "multipolygon"; readonly geometry: MultiPolygonGeometry };

export type Severity = "error" | "warning" | "info";

export type Finding = {
  readonly findingId: string;
  readonly ruleId: string;
  readonly severity: Severity;
  readonly featureId: string;
  readonly featureIndex: number;
  readonly explanation: string;
  readonly suggestedAction: string;
  readonly geometry: GeoJsonGeometry | null;
};

export type DatasetFeature = {
  readonly featureIndex: number;
  readonly featureId: string | null;
  readonly geometry: FeatureGeometry;
};

export type ValidationStatus = "succeeded" | "failed";

export type ValidationRun = {
  readonly runId: string;
  readonly datasetName: string;
  readonly sourceHash: string;
  readonly sourceCrs: string;
  readonly license: string;
  readonly featureCount: number;
  readonly rulesetId: string;
  readonly rulesetVersion: string;
  readonly parameters: Readonly<Record<string, string>>;
  readonly status: ValidationStatus;
  readonly limitations: readonly string[];
  readonly findings: readonly Finding[];
  readonly startedAt: string;
  readonly completedAt: string;
  readonly failureMessage: string | null;
};
