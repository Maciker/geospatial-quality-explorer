import type { ChatMessage } from "../domain/chatTypes.js";

const LOGGABLE_TOOL_NAMES = new Set(["list_fixtures", "run_validation", "list_findings", "explain_finding", "export_qgis"]);

/** Log-safe step labels: no tool payloads or session ids. */
export function describeLlmStep(transcript: readonly ChatMessage[], roundIndex: number): string {
  const turn = roundIndex + 1;
  const last = transcript.at(-1);
  if (!last) return `turn ${turn} initial`;
  if (last.role === "user") return `turn ${turn} after user`;
  if (last.role === "tool") {
    const toolName = toolNameForMessage(transcript, last);
    return `turn ${turn} after tool ${toolName}`;
  }
  if (last.role === "assistant" && last.toolCalls && last.toolCalls.length > 0) {
    return `turn ${turn} after assistant tool_calls ${last.toolCalls.map((call) => loggableToolName(call.name)).join(",")}`;
  }
  return `turn ${turn} follow-up`;
}

function toolNameForMessage(transcript: readonly ChatMessage[], toolMessage: ChatMessage): string {
  const toolCallId = toolMessage.toolCallId;
  if (!toolCallId) return "result";
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const message = transcript[index];
    if (message?.role !== "assistant" || !message.toolCalls) continue;
    const match = message.toolCalls.find((call) => call.id === toolCallId);
    if (match) return loggableToolName(match.name);
  }
  return "result";
}

/** The model chooses tool names, so only the known ones reach the logs. */
function loggableToolName(name: string): string {
  return LOGGABLE_TOOL_NAMES.has(name) ? name : "unknown";
}
