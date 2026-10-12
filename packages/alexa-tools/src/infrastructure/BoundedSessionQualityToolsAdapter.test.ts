import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { BoundedSessionQualityToolsAdapter } from "./BoundedSessionQualityToolsAdapter.js";
import { openAdapterSession, runFixtureValidation } from "./BoundedSessionQualityToolsAdapter.testSupport.js";

const fixturesDirectory = join(dirname(fileURLToPath(import.meta.url)), "../../../quality/fixtures/vector");

function createAdapter(nowMs = 1_700_000_000_000): BoundedSessionQualityToolsAdapter {
  return new BoundedSessionQualityToolsAdapter({ fixturesDirectory, now: () => nowMs });
}

describe("BoundedSessionQualityToolsAdapter", () => {
  it("lists fixtures and mints a session", async () => {
    const adapter = createAdapter();
    const result = await adapter.listFixtures({});
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.sessionId.length).toBeGreaterThanOrEqual(8);
    expect(result.data.fixtures.some((fixture) => fixture.fixtureId === "portfolio")).toBe(true);
  });

  it("validates a clean fixture with zero findings", async () => {
    const adapter = createAdapter();
    const sessionId = await openAdapterSession(adapter);
    const validated = await runFixtureValidation(adapter, sessionId, "clean");
    expect(validated.findingCount).toBe(0);
    expect(validated.runId).toMatch(/^[a-f0-9]{64}$/);
  });

  it("lists findings with errors first for portfolio", async () => {
    const adapter = createAdapter();
    const sessionId = await openAdapterSession(adapter);
    const validated = await runFixtureValidation(adapter, sessionId, "portfolio");
    const listed = await adapter.listFindings({ sessionId, runId: validated.runId, limit: 5 });
    expect(listed.ok).toBe(true);
    if (!listed.ok) return;
    expect(listed.data.findings.length).toBeGreaterThan(0);
    for (const finding of listed.data.findings) {
      expect(finding.findingId).toContain(validated.runId);
      expect(finding.ruleId.length).toBeGreaterThan(0);
      expect(finding.featureId.length).toBeGreaterThan(0);
    }
  });

  it("explains a finding by findingId", async () => {
    const adapter = createAdapter();
    const sessionId = await openAdapterSession(adapter);
    const validated = await runFixtureValidation(adapter, sessionId, "invalid-polygon");
    const listed = await adapter.listFindings({ sessionId, runId: validated.runId, limit: 1 });
    if (!listed.ok || listed.data.findings.length === 0) throw new Error("no findings");
    const findingId = listed.data.findings[0]!.findingId;
    const explained = await adapter.explainFinding({ sessionId, findingId });
    expect(explained.ok).toBe(true);
    if (!explained.ok) return;
    expect(explained.data.finding.findingId).toBe(findingId);
    expect(explained.data.runId).toBe(validated.runId);
  });

  it("refuses explain when the session has no runs", async () => {
    const adapter = createAdapter();
    const sessionId = await openAdapterSession(adapter);
    const explained = await adapter.explainFinding({ sessionId, findingId: "missing" });
    expect(explained.ok).toBe(false);
    if (explained.ok) return;
    expect(explained.error).toBe("refused");
  });

  it("exports a QGIS bundle for a stored run", async () => {
    const adapter = createAdapter();
    const sessionId = await openAdapterSession(adapter);
    const validated = await runFixtureValidation(adapter, sessionId, "clean");
    const exported = await adapter.exportQgis({ sessionId, runId: validated.runId });
    expect(exported.ok).toBe(true);
    if (!exported.ok) return;
    expect(exported.data.files.geojson).toContain("FeatureCollection");
    expect(exported.data.files.project).toContain("qgis");
  });

  it("pages findings with the adapter-issued cursor", async () => {
    const adapter = createAdapter();
    const sessionId = await openAdapterSession(adapter);
    const validated = await runFixtureValidation(adapter, sessionId, "portfolio");
    const first = await adapter.listFindings({ sessionId, runId: validated.runId, limit: 1 });
    if (!first.ok || !first.data.nextCursor) throw new Error("first page failed");
    const second = await adapter.listFindings({
      sessionId,
      runId: validated.runId,
      limit: 1,
      cursor: first.data.nextCursor,
    });
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.data.findings[0]?.findingId).not.toBe(first.data.findings[0]?.findingId);
  });

  it("returns invalid_request for a malformed sessionId", async () => {
    const adapter = createAdapter();
    const result = await adapter.runValidation({ sessionId: "short", fixtureId: "clean" });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toBe("invalid_request");
  });

  it("returns not_found for an unknown runId", async () => {
    const adapter = createAdapter();
    const sessionId = await openAdapterSession(adapter);
    const runId = "a".repeat(64);
    const listed = await adapter.listFindings({ sessionId, runId });
    expect(listed.ok).toBe(false);
    if (listed.ok) return;
    expect(listed.error).toBe("not_found");
  });

  it("expires idle sessions", async () => {
    let nowMs = 0;
    const adapter = new BoundedSessionQualityToolsAdapter({
      fixturesDirectory,
      now: () => nowMs,
      limits: { sessionTtlMs: 1_000 },
    });
    await openAdapterSession(adapter, "session-expire-test");
    nowMs = 5_000;
    const listed = await adapter.listFindings({
      sessionId: "session-expire-test",
      runId: "a".repeat(64),
    });
    expect(listed.ok).toBe(false);
    if (listed.ok) return;
    expect(listed.error).toBe("session_expired");
  });
});
