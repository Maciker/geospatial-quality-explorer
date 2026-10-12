import { BoundedSessionQualityToolsAdapter } from "../../../alexa-tools/src/infrastructure/BoundedSessionQualityToolsAdapter.js";
import { defaultVectorFixturesDirectory } from "./fixturesDirectory.js";

let sharedAdapter: BoundedSessionQualityToolsAdapter | null = null;

export function createBoundedQualityToolsAdapter(): BoundedSessionQualityToolsAdapter {
  if (!sharedAdapter) {
    sharedAdapter = new BoundedSessionQualityToolsAdapter({
      fixturesDirectory: defaultVectorFixturesDirectory(),
    });
  }
  return sharedAdapter;
}

export function resetSharedToolsAdapterForTests(): void {
  sharedAdapter = null;
}
