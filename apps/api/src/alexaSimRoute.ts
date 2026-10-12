import type { IncomingMessage, ServerResponse } from "node:http";
import { handleAlexaSimHttp } from "../../../packages/alexa-sim/src/infrastructure/handleAlexaSimHttp.js";

export async function handleAlexaSimRoute(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  const body = request.method === "POST" ? await readTextBody(request) : undefined;
  await handleAlexaSimHttp(
    {
      ...(request.method ? { method: request.method } : {}),
      headers: request.headers as Record<string, string | string[] | undefined>,
      ...(body !== undefined ? { body } : {}),
      pathname: url.pathname,
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

async function readTextBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}
