import type { GeoJsonGeometry, Severity, ValidationStatus } from "../../../quality/src/domain/geometry.js";

export type ListFixturesInput = {
  readonly sessionId?: string;
};

export type FixtureSummary = {
  readonly fixtureId: string;
  readonly label: string;
  readonly license: string;
  readonly defaultSourceCrs: string;
};

export type ListFixturesOutput = {
  readonly fixtures: readonly FixtureSummary[];
};

export type RunValidationInput = {
  readonly sessionId: string;
  readonly fixtureId: string;
};

export type RunValidationOutput = {
  readonly runId: string;
  readonly datasetName: string;
  readonly sourceHash: string;
  readonly findingCount: number;
  readonly status: ValidationStatus;
  readonly limitations: readonly string[];
};

export type ListFindingsInput = {
  readonly sessionId: string;
  readonly runId: string;
  readonly limit?: number;
  readonly cursor?: string | null;
};

export type FindingSummary = {
  readonly findingId: string;
  readonly ruleId: string;
  readonly severity: Severity;
  readonly featureId: string;
  readonly explanation: string;
  readonly suggestedAction: string;
  readonly geometry: GeoJsonGeometry | null;
};

export type ListFindingsOutput = {
  readonly runId: string;
  readonly findings: readonly FindingSummary[];
  readonly nextCursor: string | null;
};

export type ExplainFindingInput = {
  readonly sessionId: string;
  readonly findingId: string;
};

export type ExplainFindingOutput = {
  readonly runId: string;
  readonly finding: FindingSummary;
};

export type ExportQgisInput = {
  readonly sessionId: string;
  readonly runId: string;
};

export type QgisBundleFiles = {
  readonly geojson: string;
  readonly metadata: string;
  readonly project: string;
  readonly style: string;
};

export type ExportQgisOutput = {
  readonly runId: string;
  readonly files: QgisBundleFiles;
  readonly limitations: readonly string[];
};

export type AlexaToolName =
  | "list_fixtures"
  | "run_validation"
  | "list_findings"
  | "explain_finding"
  | "export_qgis";

/** Server-side view of a session, given to the model so follow-ups need no extra tool round. */
export type SessionSnapshot = {
  readonly sessionId: string;
  readonly runId: string;
  readonly datasetName: string;
  /** Up to 20 findings in list order, with the ids a reply may cite. */
  readonly prioritizedFindings: readonly SessionFindingRef[];
};

export type SessionFindingRef = {
  readonly findingId: string;
  readonly ruleId: string;
  readonly featureId: string;
};
