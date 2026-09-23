import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createApiServer } from "../apps/api/src/server.js";
import {
  InMemoryValidationRunRepository,
  InProcessValidationJobs,
  PlanarPolygonEngine,
  Sha256Digest,
  validateDataset,
  type ValidationRun,
} from "../packages/quality/src/index.js";
import { close, listen } from "./httpServer.js";

const engine = new PlanarPolygonEngine();
const digest = new Sha256Digest();
const startedAt = new Date("2026-09-23T00:00:00.000Z");
let server: Server | undefined;

afterEach(async () => {
  if (server) await close(server);
  server = undefined;
});

function runFor(name: string): ValidationRun {
  const sourceBytes = readFileSync(new URL(`../packages/quality/fixtures/vector/${name}.geojson`, import.meta.url));
  return validateDataset({
    collection: JSON.parse(sourceBytes.toString("utf8")) as unknown,
    sourceBytes,
    declaration: { name, sourceCrs: "EPSG:4326", license: "CC0-1.0", parameters: {} },
    digest,
    engine,
    startedAt,
    completedAt: startedAt,
  });
}

async function start(run?: ValidationRun, jobs?: InProcessValidationJobs) {
  const repository = new InMemoryValidationRunRepository();
  if (run) await repository.save(run);
  const activeJobs = jobs ?? new InProcessValidationJobs(repository, engine, digest, () => startedAt);
  server = createApiServer({ repository, jobs: activeJobs });
  return { base: await listen(server), repository };
}

function cleanCollection(): unknown {
  return JSON.parse(readFileSync(new URL("../packages/quality/fixtures/vector/clean.geojson", import.meta.url), "utf8")) as unknown;
}

function importClean(base: string, collection: unknown): Promise<Response> {
  return fetch(`${base}/api/v1/imports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ datasetName: "clean", sourceCrs: "EPSG:4326", license: "CC0-1.0", geojson: collection }),
  });
}

async function waitForTerminal(base: string, jobId: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const response = await fetch(`${base}/api/v1/jobs/${jobId}`);
    const body = await response.json() as { status: string; runId: string | null; message: string | null };
    if (body.status === "succeeded" || body.status === "failed" || body.status === "cancelled") return body;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("job did not finish");
}

describe("The findings API", () => {
  it("rejects an unknown run and a removed placeholder route", async () => {
    const { base } = await start();
    const unknown = await fetch(`${base}/api/v1/runs/${"a".repeat(64)}`);
    const placeholder = await fetch(`${base}/api/v1/findings`);

    expect(unknown.status).toBe(404);
    expect(placeholder.status).toBe(404);
  });

  it("returns an empty collection for a clean run", async () => {
    const run = runFor("clean");
    const { base } = await start(run);

    const response = await fetch(`${base}/api/v1/runs/${run.runId}/findings`);
    const body = await response.json() as { features: unknown[] };

    expect(response.status).toBe(200);
    expect(body.features).toEqual([]);
  });

  it("rejects injection-like filters and preserves finding order", async () => {
    const run = runFor("portfolio");
    const { base } = await start(run);
    const malicious = await fetch(`${base}/api/v1/runs/${run.runId}/findings?ruleId=${encodeURIComponent("geometry.invalid' OR '1'='1")}`);
    const ordered = await fetch(`${base}/api/v1/runs/${run.runId}/findings?limit=100`);
    const body = await ordered.json() as { features: Array<{ properties: { featureId: string; ruleId: string } }> };

    expect(malicious.status).toBe(400);
    expect(body.features.map((feature) => `${feature.properties.featureId}:${feature.properties.ruleId}`)).toEqual(
      run.findings.map((finding) => `${finding.featureId}:${finding.ruleId}`),
    );
  });

  it("pages findings and applies a bounding box", async () => {
    const run = runFor("portfolio");
    const { base } = await start(run);
    const first = await fetch(`${base}/api/v1/runs/${run.runId}/findings?limit=1`);
    const firstBody = await first.json() as { features: Array<{ id: string }>; nextCursor: string };
    const second = await fetch(`${base}/api/v1/runs/${run.runId}/findings?limit=1&cursor=${firstBody.nextCursor}`);
    const boxed = await fetch(`${base}/api/v1/runs/${run.runId}/findings?bbox=-0.1,1.9,1.1,3.1`);
    const boxedBody = await boxed.json() as { features: Array<{ properties: { featureId: string } }> };

    expect((await second.json() as { features: Array<{ id: string }> }).features[0]?.id).not.toBe(firstBody.features[0]?.id);
    expect(boxedBody.features.map((feature) => feature.properties.featureId)).toEqual(["bowtie-1"]);
  });

  it("publishes OpenAPI and local CORS", async () => {
    const { base } = await start();
    const spec = await fetch(`${base}/openapi.json`);
    const cors = await fetch(`${base}/health`, { headers: { Origin: "http://127.0.0.1:5173" } });
    const foreign = await fetch(`${base}/health`, { headers: { Origin: "https://example.test" } });

    expect(JSON.stringify(await spec.json())).toContain("/api/v1/runs/{runId}/findings");
    expect(cors.headers.get("access-control-allow-origin")).toBe("http://127.0.0.1:5173");
    expect(foreign.headers.get("access-control-allow-origin")).toBeNull();
  });

  it("imports inline GeoJSON and rejects a remote URL or archive", async () => {
    const { base } = await start();
    const created = await importClean(base, cleanCollection());
    const job = await created.json() as { jobId: string };
    const finished = await waitForTerminal(base, job.jobId);
    const remote = await fetch(`${base}/api/v1/imports`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "http://127.0.0.1/secret.geojson" }),
    });
    const archive = await fetch(`${base}/api/v1/imports`, {
      method: "POST",
      headers: { "Content-Type": "application/zip" },
      body: "PK",
    });

    expect(finished.status).toBe("succeeded");
    expect(remote.status).toBe(400);
    expect(archive.status).toBe(415);
  });

  it("cancels an import before storing a run", async () => {
    let release = (): void => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const repository = new InMemoryValidationRunRepository();
    const jobs = new InProcessValidationJobs(repository, engine, digest, () => startedAt, () => gate);
    const started = await start(undefined, jobs);
    const collection = cleanCollection();
    const created = await importClean(started.base, collection);
    const job = await created.json() as { jobId: string };
    const cancelled = await fetch(`${started.base}/api/v1/jobs/${job.jobId}/cancel`, { method: "POST" });
    release();
    const finished = await waitForTerminal(started.base, job.jobId);

    const sourceBytes = Buffer.from(JSON.stringify(collection));
    const run = validateDataset({
      collection,
      sourceBytes,
      declaration: { name: "clean", sourceCrs: "EPSG:4326", license: "CC0-1.0", parameters: {} },
      digest,
      engine,
      startedAt,
      completedAt: startedAt,
    });
    const stored = await repository.findById(run.runId);

    expect(cancelled.status).toBe(200);
    expect(finished.status).toBe("cancelled");
    expect(finished.runId).toBeNull();
    expect(() => stored.orElseThrow(new Error("absent"))).toThrow(/absent/);
  });
});
