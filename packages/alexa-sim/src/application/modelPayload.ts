import type { SessionSnapshot } from "../../../alexa-tools/src/domain/toolContracts.js";
import type { ChatMessage } from "../domain/chatTypes.js";

/**
 * The model only orchestrates tools and cites ids, so it gets neither geometries nor export
 * file contents. The full result still reaches the UI; this only shortens model prompts.
 */
export function compactToolResultForModel(result: object): unknown {
  if (!("data" in result) || !isRecord(result.data)) return result;
  const data = { ...result.data };
  if (isRecord(data.files)) {
    data.files = {
      names: ["findings.qgs", "findings.geojson", "findings.qml", "run-metadata.json"],
      note: "Delivered to the user's download button. Do not repeat file contents.",
    };
  }
  if (Array.isArray(data.findings)) data.findings = data.findings.map(withoutGeometry);
  if (isRecord(data.finding)) data.finding = withoutGeometry(data.finding);
  return { ...result, data };
}

export function sessionContextMessage(snapshot: SessionSnapshot): ChatMessage {
  const findings = snapshot.prioritizedFindingIds.length === 0
    ? "The run has no findings."
    : `Findings in priority order: ${snapshot.prioritizedFindingIds.join(", ")}.`;
  return {
    role: "system",
    content: [
      `Session context from the server: sessionId ${snapshot.sessionId}; current runId ${snapshot.runId} (dataset ${snapshot.datasetName}).`,
      findings,
      "Use these ids directly with explain_finding or export_qgis; \"next\" means the id after the last one discussed. Call list_findings only when the user asks for the list.",
    ].join(" "),
  };
}

function withoutGeometry(value: unknown): unknown {
  if (!isRecord(value)) return value;
  const rest = { ...value };
  delete rest.geometry;
  return rest;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
