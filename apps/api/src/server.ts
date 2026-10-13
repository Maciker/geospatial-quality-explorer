import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import {
  DATASET_LIMITS,
  DomainError,
  InMemoryValidationRunRepository,
  InProcessValidationJobs,
  PlanarPolygonEngine,
  Sha256Digest,
  pageFindings,
  parseFindingQuery,
  type ValidationRunRepository,
} from "../../../packages/quality/src/index.js";
import { handleAlexaSimRoute } from "./alexaSimRoute.js";
import { openApiDocument } from "./openapi.js";

type ApiDependencies = {
  readonly repository: ValidationRunRepository;
  readonly jobs: InProcessValidationJobs;
};

const LOCAL_ORIGINS = new Set([
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
]);

export function createApiServer(dependencies?: ApiDependencies) {
  const repository = dependencies?.repository ?? new InMemoryValidationRunRepository();
  const jobs = dependencies?.jobs ?? new InProcessValidationJobs(
    repository,
    new PlanarPolygonEngine(),
    new Sha256Digest(),
    () => new Date(),
  );
  return createServer((request, response) => {
    void route(request, response, repository, jobs);
  });
}

export function assertLoopbackHost(host: string): void {
  if (!isLoopbackAddress(host)) {
    throw DomainError.createValidation("The unauthenticated API must bind to a loopback host.");
  }
}

export function isLoopbackAddress(address: string | undefined): boolean {
  return address === "127.0.0.1" || address === "::1" || address === "::ffff:127.0.0.1" || address === "localhost";
}

async function route(
  request: IncomingMessage,
  response: ServerResponse,
  repository: ValidationRunRepository,
  jobs: InProcessValidationJobs,
): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (url.pathname.startsWith("/api/v1/alexa-sim")) {
    await handleAlexaSimRoute(request, response);
    return;
  }
  applyCors(request, response);
  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end();
    return;
  }
  try {
    if (request.method === "GET" && url.pathname === "/health") {
      send(response, 200, { status: "ok", service: "geospatial-quality-explorer-api", timestamp: new Date().toISOString() });
      return;
    }
    if (request.method === "GET" && url.pathname === "/openapi.json") {
      send(response, 200, openApiDocument);
      return;
    }
    if (url.pathname.startsWith("/api/") && !isLoopbackAddress(request.socket.remoteAddress)) {
      send(response, 403, { error: "loopback_only", message: "This local API accepts loopback clients only." });
      return;
    }
    if (request.method === "GET" && url.pathname.startsWith("/api/v1/runs/")) {
      await readRun(url, response, repository);
      return;
    }
    if (request.method === "POST" && url.pathname === "/api/v1/imports") {
      await importDataset(request, response, jobs);
      return;
    }
    if (url.pathname.startsWith("/api/v1/jobs/")) {
      await readJob(request, url, response, jobs);
      return;
    }
    send(response, 404, { error: "not_found", message: "That route does not exist." });
  } catch (error) {
    if (error instanceof PayloadTooLarge) {
      send(response, 413, { error: "too_large", message: error.message });
      return;
    }
    if (error instanceof UnsupportedUpload) {
      send(response, 415, { error: "unsupported_media", message: error.message });
      return;
    }
    if (error instanceof DomainError && error.type === "notFound") {
      const code = error.message.toLowerCase().includes("job") ? "unknown_job" : "unknown_run";
      send(response, 404, { error: code, message: error.message });
      return;
    }
    if (error instanceof DomainError) {
      send(response, 400, { error: "invalid_request", message: error.message });
      return;
    }
    send(response, 500, { error: "internal_error", message: "The request could not be completed." });
  }
}

async function readRun(url: URL, response: ServerResponse, repository: ValidationRunRepository): Promise<void> {
  const match = /^\/api\/v1\/runs\/([^/]+)(\/findings)?$/.exec(url.pathname);
  const runId = match?.[1];
  if (!runId || !/^[a-f0-9]{64}$/.test(runId)) {
    throw DomainError.createValidation("query.run_id: Run id must be a 64 character hex digest.");
  }
  const run = (await repository.findById(runId)).orElseThrow(DomainError.createNotFound(`Unknown run ${runId}.`));
  if (match[2] !== "/findings") {
    send(response, 200, {
      runId: run.runId,
      datasetName: run.datasetName,
      sourceHash: run.sourceHash,
      sourceCrs: run.sourceCrs,
      license: run.license,
      rulesetId: run.rulesetId,
      rulesetVersion: run.rulesetVersion,
      status: run.status,
      limitations: run.limitations,
      findingCount: run.findings.length,
    });
    return;
  }
  const page = pageFindings(run.findings, parseFindingQuery(url.searchParams));
  send(response, 200, {
    type: "FeatureCollection",
    runId: run.runId,
    features: page.findings.map((finding) => ({
      type: "Feature",
      id: finding.findingId,
      geometry: finding.geometry,
      properties: {
        findingId: finding.findingId,
        ruleId: finding.ruleId,
        severity: finding.severity,
        featureId: finding.featureId,
        explanation: finding.explanation,
        suggestedAction: finding.suggestedAction,
      },
    })),
    nextCursor: page.nextCursor,
  });
}

async function importDataset(request: IncomingMessage, response: ServerResponse, jobs: InProcessValidationJobs): Promise<void> {
  const contentType = request.headers["content-type"] ?? "";
  if (contentType.includes("zip") || contentType.includes("octet-stream")) {
    throw new UnsupportedUpload("Archive uploads are not accepted.");
  }
  const body = await readBody(request);
  if (!isRecord(body)) throw DomainError.createValidation("import.invalid: The import body must be a JSON object.");
  const unexpected = Object.keys(body).filter((key) => !["datasetName", "sourceCrs", "license", "geojson"].includes(key));
  if (unexpected.length > 0) {
    throw DomainError.createValidation("import.rejected: Remote URLs and file paths are not accepted. Send inline GeoJSON.");
  }
  if (typeof body.datasetName !== "string" || typeof body.sourceCrs !== "string" || typeof body.license !== "string") {
    throw DomainError.createValidation("import.invalid: datasetName, sourceCrs, and license are required.");
  }
  const { collection, sourceBytes } = readInlineGeoJson(body.geojson);
  const job = jobs.submit({
    declaration: { name: body.datasetName, sourceCrs: body.sourceCrs, license: body.license, parameters: {} },
    collection,
    sourceBytes,
  });
  send(response, 202, job);
}

/** GeoJSON text is hashed byte for byte, like a CLI file; a parsed object is hashed as compact JSON. */
function readInlineGeoJson(geojson: unknown): { collection: unknown; sourceBytes: Buffer } {
  if (typeof geojson !== "string") return { collection: geojson, sourceBytes: Buffer.from(JSON.stringify(geojson)) };
  try {
    return { collection: JSON.parse(geojson) as unknown, sourceBytes: Buffer.from(geojson, "utf8") };
  } catch {
    throw DomainError.createValidation("dataset.invalid_json: The geojson text is not JSON.");
  }
}

async function readJob(
  request: IncomingMessage,
  url: URL,
  response: ServerResponse,
  jobs: InProcessValidationJobs,
): Promise<void> {
  const match = /^\/api\/v1\/jobs\/([^/]+)(\/cancel)?$/.exec(url.pathname);
  const jobId = match?.[1];
  if (!jobId) throw DomainError.createValidation("query.job_id: Job id is required.");
  if (match[2] === "/cancel") {
    if (request.method !== "POST") throw DomainError.createValidation("import.method: Cancel the job with POST.");
    send(response, 200, jobs.cancel(jobId));
    return;
  }
  if (request.method !== "GET") throw DomainError.createValidation("import.method: Read the job with GET.");
  const job = jobs.get(jobId);
  if (!job) throw DomainError.createNotFound(`Unknown job ${jobId}.`);
  send(response, 200, job);
}

function applyCors(request: IncomingMessage, response: ServerResponse): void {
  const origin = request.headers.origin;
  if (typeof origin === "string" && LOCAL_ORIGINS.has(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("Vary", "Origin");
    response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
}

function send(response: ServerResponse, status: number, body: unknown): void {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(body));
}

async function readBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > DATASET_LIMITS.maxBytes) {
      throw new PayloadTooLarge(`Datasets are limited to ${DATASET_LIMITS.maxBytes} bytes.`);
    }
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks);
  if (raw.subarray(0, 2).toString() === "PK") throw new UnsupportedUpload("Archive uploads are not accepted.");
  try {
    return JSON.parse(raw.toString("utf8")) as unknown;
  } catch {
    throw DomainError.createValidation("import.invalid: The import body is not JSON.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

class PayloadTooLarge extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayloadTooLarge";
  }
}

class UnsupportedUpload extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedUpload";
  }
}
