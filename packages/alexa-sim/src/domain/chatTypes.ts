export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ToolCallRequest = {
  readonly id: string;
  readonly name: string;
  readonly argumentsJson: string;
};

export type ChatMessage = {
  readonly role: ChatRole;
  readonly content: string;
  readonly toolCallId?: string;
  readonly toolCalls?: readonly ToolCallRequest[];
};

export type AlexaSimChatRequest = {
  readonly sessionId?: string;
  readonly messages: readonly ChatMessage[];
};

export type QgisExportArtifact = {
  readonly runId: string;
  readonly files: {
    readonly geojson: string;
    readonly metadata: string;
    readonly project: string;
    readonly style: string;
  };
};

export type AlexaSimChatResponse = {
  readonly sessionId: string;
  readonly assistantMessage: string;
  readonly findings: readonly CitedFindingCard[];
  readonly runId: string | null;
  /** Catalog fixture id / dataset name from the active validation run, when known. */
  readonly datasetName: string | null;
  /** SHA-256 of the validated fixture bytes, when known. */
  readonly sourceHash: string | null;
  readonly refused: boolean;
  readonly qgisExport: QgisExportArtifact | null;
};

export type CitedFindingCard = {
  readonly findingId: string;
  readonly ruleId: string;
  readonly featureId: string;
  readonly severity: string;
  readonly explanation: string;
  readonly suggestedAction: string;
  readonly geometry: unknown;
};
