import type { AlexaChatResponse } from "./alexaSimApi";

/**
 * Server-confirmed context is invalid when the turn refused without a run and without cards —
 * e.g. choose/revalidate after a lost session. Do not treat a normal empty successful turn as invalid.
 */
export function isAlexaSessionContextValid(response: AlexaChatResponse): boolean {
  if (!response.refused) return true;
  if (response.runId !== null) return true;
  if (response.findings.length > 0) return true;
  return false;
}
