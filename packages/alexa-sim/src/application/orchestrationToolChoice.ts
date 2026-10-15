import type { ChatMessage } from "../domain/chatTypes.js";
import type { LlmToolChoice } from "./LlmPort.js";

type ForcedToolName = "list_fixtures" | "run_validation" | "list_findings" | "explain_finding" | "export_qgis";

/** Force the first model call on a turn to invoke tools when user intent is unambiguous. */
export function toolChoiceForTurn(
  transcript: readonly ChatMessage[],
  sessionId: string,
  roundIndex: number,
): LlmToolChoice {
  if (roundIndex > 0) return "auto";
  const forced = forcedToolForTurn(transcript, sessionId);
  if (!forced) return "auto";
  return { type: "function", function: { name: forced } };
}

export function forcedToolForTurn(transcript: readonly ChatMessage[], sessionId: string): ForcedToolName | null {
  const lastUser = lastUserMessage(transcript);
  if (!lastUser || hasToolResultSinceLastUser(transcript)) return null;
  for (const clause of lastUser.content.toLowerCase().split(/[.!?;]+/)) {
    const forced = forcedToolForCommand(commandText(clause), sessionId);
    if (forced) return forced;
  }
  return null;
}

/** Leading courtesy words that still make a command: "OK, now please", "can you", "let's". */
const POLITE_PREFIX = /^(?:(?:ok(?:ay)?|now|then|and|so|alright|great|thanks|hi|hello|hey|yes|yeah|sure)\b[\s,]*)*(?:(?:please|can you|could you|would you|will you|let's|lets|go ahead and|i want you to|i'd like you to)\b[\s,]*)*(?:please\b[\s,]*)?/;

/** The clause as an imperative, or null for a question or a negated request. */
function commandText(clause: string): string | null {
  const trimmed = clause.trim();
  const command = trimmed.replace(POLITE_PREFIX, "");
  if (command === trimmed && /^(?:what|how|why|which|who|when|where|does|do|is|are|was|were|should|can|could)\b/.test(trimmed)) {
    return null;
  }
  if (/\b(?:don't|dont|do not|not|never|no need|stop|without|instead of|yet)\b/.test(trimmed)) return null;
  return command;
}

function forcedToolForCommand(command: string | null, sessionId: string): ForcedToolName | null {
  if (command === null) return null;
  if (/^(?:validate|run (?:the )?validation|check)\b/.test(command) && /\b(?:portfolio|fixture)\b/.test(command)) {
    return sessionId.length > 0 ? "run_validation" : "list_fixtures";
  }
  if (sessionId.length === 0) return null;
  if (/^(?:export|download)\b/.test(command)) return "export_qgis";
  if (/^explain\s+(?:(?:the|this|that)\s+)?(?:next|first|top|second|third|last|previous|it|this|that|one|finding)\b/.test(command)) {
    return "explain_finding";
  }
  if (/^(?:list|show(?: me)?|give me|read(?: me)?)\s+(?:all\s+)?(?:the\s+)?findings\b/.test(command)) return "list_findings";
  return null;
}

function lastUserMessage(transcript: readonly ChatMessage[]): ChatMessage | null {
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    const message = transcript[index];
    if (message?.role === "user") return message;
  }
  return null;
}

function hasToolResultSinceLastUser(transcript: readonly ChatMessage[]): boolean {
  let lastUserIndex = -1;
  for (let index = transcript.length - 1; index >= 0; index -= 1) {
    if (transcript[index]?.role === "user") {
      lastUserIndex = index;
      break;
    }
  }
  if (lastUserIndex < 0) return false;
  for (let index = lastUserIndex + 1; index < transcript.length; index += 1) {
    if (transcript[index]?.role === "tool") return true;
  }
  return false;
}
