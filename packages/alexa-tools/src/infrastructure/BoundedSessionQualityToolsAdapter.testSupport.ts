import type { BoundedSessionQualityToolsAdapter } from "./BoundedSessionQualityToolsAdapter.js";
import type { RunValidationOutput } from "../domain/toolContracts.js";

export async function openAdapterSession(
  adapter: BoundedSessionQualityToolsAdapter,
  sessionId?: string,
): Promise<string> {
  const session = await adapter.listFixtures(sessionId === undefined ? {} : { sessionId });
  if (!session.ok) throw new Error("session failed");
  return session.sessionId;
}

export async function runFixtureValidation(
  adapter: BoundedSessionQualityToolsAdapter,
  sessionId: string,
  fixtureId: string,
): Promise<RunValidationOutput> {
  const validated = await adapter.runValidation({ sessionId, fixtureId });
  if (!validated.ok) throw new Error("validation failed");
  return validated.data;
}
