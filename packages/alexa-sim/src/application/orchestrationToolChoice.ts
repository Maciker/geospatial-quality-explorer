import type { ChatMessage } from "../domain/chatTypes.js";
import type { LlmToolChoice } from "./LlmPort.js";

type ForcedToolName = "list_fixtures" | "run_validation" | "list_findings";

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
  const text = lastUser.content.toLowerCase();
  if (text.includes("valid") && (text.includes("portfolio") || text.includes("fixture"))) {
    return sessionId.length > 0 ? "run_validation" : "list_fixtures";
  }
  if (text.includes("list") && text.includes("finding") && sessionId.length > 0) {
    return "list_findings";
  }
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
