import { createServer } from "node:http";

export function createApiServer() {
  return createServer((request, response) => {
    response.setHeader("Content-Type", "application/json");
    if (request.method === "GET" && request.url === "/health") {
      response.statusCode = 200;
      response.end(JSON.stringify({ status: "ok", service: "geospatial-quality-explorer-api", timestamp: new Date().toISOString() }));
      return;
    }
    if (request.method === "GET" && request.url === "/api/v1/findings") {
      response.statusCode = 200;
      response.end(JSON.stringify({ type: "FeatureCollection", features: [] }));
      return;
    }
    response.statusCode = 404;
    response.end(JSON.stringify({ error: "not_found" }));
  });
}
