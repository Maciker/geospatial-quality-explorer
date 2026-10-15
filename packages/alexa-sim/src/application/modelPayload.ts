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
    data.voiceAnswer = "The QGIS export is ready. Download the bundle from the simulation panel.";
  }
  if ("findingCount" in data && "runId" in data && typeof data.datasetName === "string") {
    data.voiceAnswer = `Validation finished for ${data.datasetName}. runId ${String(data.runId)}. ${String(data.findingCount)} findings. Ask when you want the prioritized list.`;
  }
  if (Array.isArray(data.findings)) {
    const summaries = data.findings.map(withoutGeometry);
    data.findings = summaries;
    const first = summaries[0];
    data.voiceAnswer = isRecord(first)
      ? `${summaries.length} findings listed. Top finding: ${formatFindingVoiceAnswer(first)}`
      : `No findings for runId ${String(data.runId)}.`;
  }
  if (isRecord(data.finding)) {
    const finding = withoutGeometry(data.finding);
    data.finding = finding;
    if (isRecord(finding)) data.voiceAnswer = formatFindingVoiceAnswer(finding);
  }
  return { ...result, data };
}

export function readVoiceAnswerFromCompactPayload(compacted: unknown): string | null {
  if (!isRecord(compacted) || !isRecord(compacted.data)) return null;
  const voice = compacted.data.voiceAnswer;
  if (typeof voice !== "string") return null;
  const trimmed = voice.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function sessionContextMessage(snapshot: SessionSnapshot): ChatMessage {
  const findings = snapshot.prioritizedFindings.length === 0
    ? "The run has no findings."
    : `Findings in priority order: ${snapshot.prioritizedFindings.map((finding) => finding.findingId).join(", ")}.`;
  return {
    role: "system",
    content: [
      `Session context from the server: sessionId ${snapshot.sessionId}; current runId ${snapshot.runId} (dataset ${snapshot.datasetName}).`,
      findings,
      "Use these ids directly with explain_finding or export_qgis; omit runId on export_qgis to use the current run. \"Next\" means the id after the last one discussed. Call list_findings only when the user asks for the full list.",
      "Tool results carry voiceAnswer, which the server speaks to the user as the reply.",
    ].join(" "),
  };
}

/** Keeps system prompts while dropping older tool chatter that slows live models. */
export function trimTranscriptForModel(messages: readonly ChatMessage[], maxNonSystemMessages = 8): ChatMessage[] {
  const system = messages.filter((message) => message.role === "system");
  const conversational = messages.filter((message) => message.role !== "system");
  const lastUserIndex = conversational.map((message) => message.role).lastIndexOf("user");
  let start = Math.max(0, conversational.length - maxNonSystemMessages);
  if (lastUserIndex >= 0) start = Math.min(start, lastUserIndex);
  // A tool result must follow the assistant message that called it, or providers reject the request.
  while (start > 0 && conversational[start]?.role === "tool") start -= 1;
  return [...system, ...conversational.slice(start)];
}

function formatFindingVoiceAnswer(finding: Record<string, unknown>): string {
  const findingId = String(finding.findingId ?? "unknown");
  const ruleId = String(finding.ruleId ?? "unknown");
  const severity = String(finding.severity ?? "unknown");
  const featureId = String(finding.featureId ?? "unknown");
  const explanation = String(finding.explanation ?? "");
  return `findingId ${findingId} (${ruleId}, ${severity}) on featureId ${featureId}: ${explanation}`;
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
