/** User-facing recovery copy when the server no longer has a validated run for this session. */
export const SESSION_RECOVERY_PROMPT =
  "This session no longer has a validated run on this server. Ask me to validate an allowed fixture (for example the portfolio fixture), then we can list findings, explain, or export again.";

const CATALOG_FIXTURE_TOKEN = /\b(portfolio|clean|duplicate-ids|empty-geometry|invalid-polygon|multipolygon|valid-hole)\b/;

/** Leading courtesy words that still make a command (aligned with orchestrationToolChoice). */
const POLITE_PREFIX = /^(?:(?:ok(?:ay)?|now|then|and|so|alright|great|thanks|hi|hello|hey|yes|yeah|sure)\b[\s,]*)*(?:(?:please|can you|could you|would you|will you|let's|lets|go ahead and|i want you to|i'd like you to)\b[\s,]*)*(?:please\b[\s,]*)?/;

/** Fixture id named in a validate/check command, if it matches the known catalog. */
export function catalogFixtureFromValidateCommand(userText: string): string | null {
  for (const clause of userText.toLowerCase().split(/[.!?;]+/)) {
    const command = commandText(clause);
    if (command === null) continue;
    if (!/^(?:validate|run (?:the )?validation|check)\b/.test(command)) continue;
    if (!/\b(?:fixture|portfolio|clean|duplicate-ids|empty-geometry|invalid-polygon|multipolygon|valid-hole)\b/.test(command)) {
      continue;
    }
    const match = command.match(CATALOG_FIXTURE_TOKEN);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** List / explain / export intents that need a server-side validated run. */
export function isRunScopedIntent(userText: string): boolean {
  for (const clause of userText.toLowerCase().split(/[.!?;]+/)) {
    const command = commandText(clause);
    if (command === null) continue;
    if (/^(?:list|show(?: me)?|give me|read(?: me)?)\s+(?:all\s+)?(?:the\s+)?findings\b/.test(command)) return true;
    if (/^explain\s+(?:(?:the|this|that)\s+)?(?:next|first|top|second|third|last|previous|it|this|that|one|finding)\b/.test(command)) {
      return true;
    }
    if (/^(?:export|download)\b/.test(command)) return true;
  }
  return false;
}

export function lastUserContent(messages: readonly { role: string; content: string }[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user") return message.content;
  }
  return "";
}

/** The clause as an imperative, or null for a question or a negated request. */
function commandText(clause: string): string | null {
  const trimmed = clause.trim();
  if (trimmed.length === 0) return null;
  const command = trimmed.replace(POLITE_PREFIX, "");
  if (command === trimmed && /^(?:what|how|why|which|who|when|where|does|do|is|are|was|were|should|can|could)\b/.test(trimmed)) {
    return null;
  }
  if (/\b(?:don't|dont|do not|not|never|no need|stop|without|instead of|yet)\b/.test(trimmed)) return null;
  return command;
}
