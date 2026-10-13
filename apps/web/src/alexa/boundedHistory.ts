import type { AlexaChatMessage } from "./alexaSimApi";

// Mirrors ALEXA_SIM_LIMITS in packages/alexa-sim with headroom for the JSON envelope.
const MAX_MESSAGES = 40;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_HISTORY_CHARS = 48_000;

/** Newest-first trim so a long conversation never trips the server request limits. */
export function boundedHistory(messages: readonly AlexaChatMessage[]): AlexaChatMessage[] {
  const kept: AlexaChatMessage[] = [];
  let total = 0;
  for (const message of [...messages].reverse()) {
    if (kept.length === MAX_MESSAGES) break;
    const content = message.content.length > MAX_MESSAGE_CHARS ? `${message.content.slice(0, MAX_MESSAGE_CHARS - 1)}…` : message.content;
    total += content.length;
    if (total > MAX_HISTORY_CHARS && kept.length > 0) break;
    kept.push({ role: message.role, content });
  }
  return kept.reverse();
}
