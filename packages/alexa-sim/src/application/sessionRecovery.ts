/** User-facing recovery copy when the server no longer has a validated run for this session. */
export const SESSION_RECOVERY_PROMPT =
  "This session no longer has a validated run on this server. Ask me to validate an allowed fixture (for example the portfolio fixture), then we can list findings, explain, or export again.";

const CATALOG_FIXTURE_TOKEN = /\b(portfolio|clean|duplicate-ids|empty-geometry|invalid-polygon|multipolygon|valid-hole)\b/;

/** Fixture id named in a validate/check command, if it matches the known catalog. */
export function catalogFixtureFromValidateCommand(userText: string): string | null {
  const normalized = userText.toLowerCase();
  if (!/\b(?:validate|run (?:the )?validation|check)\b/.test(normalized)) return null;
  if (!/\b(?:fixture|portfolio|clean|duplicate-ids|empty-geometry|invalid-polygon|multipolygon|valid-hole)\b/.test(normalized)) {
    return null;
  }
  const match = normalized.match(CATALOG_FIXTURE_TOKEN);
  return match?.[1] ?? null;
}

/** List / explain / export intents that need a server-side validated run. */
export function isRunScopedIntent(userText: string): boolean {
  const normalized = userText.toLowerCase();
  if (/\b(?:list|show(?: me)?|give me|read(?: me)?)\s+(?:all\s+)?(?:the\s+)?findings\b/.test(normalized)) return true;
  if (/\bexplain\b/.test(normalized)) return true;
  if (/\b(?:export|download)\b/.test(normalized)) return true;
  return false;
}

export function lastUserContent(messages: readonly { role: string; content: string }[]): string {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === "user") return message.content;
  }
  return "";
}
