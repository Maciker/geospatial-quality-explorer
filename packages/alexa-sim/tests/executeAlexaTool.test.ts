import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BoundedSessionQualityToolsAdapter } from "../../alexa-tools/src/infrastructure/BoundedSessionQualityToolsAdapter.js";
import { executeAlexaTool } from "../src/application/executeAlexaTool.js";

const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../quality/fixtures/vector");

describe("executeAlexaTool", () => {
  it("uses the session latest run when export_qgis omits runId", async () => {
    const tools = new BoundedSessionQualityToolsAdapter({ fixturesDirectory });
    const opened = await tools.listFixtures({});
    expect(opened.ok).toBe(true);
    if (!opened.ok) return;
    const sessionId = opened.sessionId;
    const validated = await tools.runValidation({ sessionId, fixtureId: "portfolio" });
    expect(validated.ok).toBe(true);
    if (!validated.ok) return;

    const exported = await executeAlexaTool(
      tools,
      "export_qgis",
      JSON.stringify({ sessionId }),
      sessionId,
    );

    expect(exported.result.ok).toBe(true);
    if (!exported.result.ok || !validated.ok) return;
    const exportData = exported.result.data as { runId: string };
    expect(exportData.runId).toBe(validated.data.runId);
  });
});
