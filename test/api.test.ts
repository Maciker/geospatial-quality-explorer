import { afterEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createApiServer } from "../apps/api/src/server.js";

let server: Server | undefined;
afterEach(async () => { if (server) await new Promise<void>((resolve, reject) => server!.close(error => error ? reject(error) : resolve())); });
async function baseUrl() {
  server = createApiServer();
  await new Promise<void>(resolve => server!.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Expected TCP address");
  return `http://127.0.0.1:${address.port}`;
}
describe("The GIS API", () => {
  it("reports the service identity and UTC timestamp", async () => {
    const base = await baseUrl();
    const response = await fetch(`${base}/health`);
    expect(response.status).toBe(200);
    const body = await response.json() as { status: string; service: string; timestamp: string };
    expect(body.status).toBe("ok");
    expect(body.service).toBe("geospatial-quality-explorer-api");
    expect(Number.isFinite(Date.parse(body.timestamp))).toBe(true);
    expect(body.timestamp.endsWith("Z")).toBe(true);
  });
});
