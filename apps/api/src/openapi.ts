export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Geospatial Quality Explorer API",
    version: "0.1.0",
    description: "Loopback API for stored validation runs. There is no FastAPI service. CORS allows the local Vite origins only.",
  },
  paths: {
    "/health": { get: { summary: "Service health" } },
    "/api/v1/runs/{runId}": { get: { summary: "Read one validation run" } },
    "/api/v1/runs/{runId}/findings": {
      get: {
        summary: "Read a bounded GeoJSON page of findings",
        parameters: [
          { name: "severity", in: "query", schema: { type: "string", enum: ["error", "warning", "info"] } },
          { name: "ruleId", in: "query", schema: { type: "string" } },
          { name: "bbox", in: "query", schema: { type: "string", example: "-1,-1,2,2" } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "cursor", in: "query", schema: { type: "string" } },
        ],
      },
    },
    "/api/v1/imports": { post: { summary: "Import an inline GeoJSON dataset on loopback" } },
    "/api/v1/jobs/{jobId}": { get: { summary: "Read an import job" } },
    "/api/v1/jobs/{jobId}/cancel": { post: { summary: "Cancel a pending or running import" } },
  },
} as const;
