import type { IncomingMessage, ServerResponse } from "node:http";
import { ALEXA_SIM_LIMITS, handleAlexaSimHttp } from "../../../packages/alexa-sim/src/infrastructure/handleAlexaSimHttp.js";

export async function handleAlexaSimRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const body = request.method === "POST" ? await readTextBody(request) : undefined;
  await handleAlexaSimHttp(
    {
      ...(request.method ? { method: request.method } : {}),
      headers: request.headers as Record<string, string | string[] | undefined>,
      ...(body !== undefined ? { body } : {}),
      pathname: url.pathname,
      ...(request.socket.remoteAddress ? { clientAddress: request.socket.remoteAddress } : {}),
    },
    {
      status(code: number) {
        response.statusCode = code;
        return this;
      },
      setHeader(name: string, value: string) {
        response.setHeader(name, value);
      },
      end(payload?: string) {
        response.end(payload);
      },
    },
  );
}

/** Stops buffering one byte past the limit; the handler then answers 413 without holding the whole upload. */
async function readTextBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    if (total > ALEXA_SIM_LIMITS.maxBodyBytes) continue;
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    chunks.push(buffer);
    total += buffer.length;
  }
  return Buffer.concat(chunks).subarray(0, ALEXA_SIM_LIMITS.maxBodyBytes + 1).toString("utf8");
}
