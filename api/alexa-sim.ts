import { handleAlexaSimHttp } from "../packages/alexa-sim/src/infrastructure/handleAlexaSimHttp.js";

type VercelRequest = {
  method?: string;
  url?: string;
  query?: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
  body?: unknown;
};

type VercelResponse = {
  status(code: number): VercelResponse;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
};

export default async function handler(request: VercelRequest, response: VercelResponse): Promise<void> {
  const body = typeof request.body === "string"
    ? request.body
    : request.body === undefined || request.body === null
      ? undefined
      : JSON.stringify(request.body);
  await handleAlexaSimHttp(
    {
      ...(request.method ? { method: request.method } : {}),
      headers: request.headers,
      ...(body !== undefined ? { body } : {}),
      pathname: resolveAlexaPathname(request),
    },
    {
      status(code: number) {
        response.status(code);
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

/** Rewrites land on /api/alexa-sim?alexaPath=… so GET is not collapsed to health. */
function resolveAlexaPathname(request: VercelRequest): string {
  const raw = request.query?.alexaPath;
  const pathPart = Array.isArray(raw) ? raw[0] : raw;
  if (typeof pathPart === "string" && pathPart.length > 0) {
    return `/api/v1/alexa-sim/${pathPart.replace(/^\/+/, "")}`;
  }
  if (typeof request.url === "string") {
    try {
      const url = new URL(request.url, "http://127.0.0.1");
      const fromQuery = url.searchParams.get("alexaPath");
      if (fromQuery && fromQuery.length > 0) {
        return `/api/v1/alexa-sim/${fromQuery.replace(/^\/+/, "")}`;
      }
    } catch {
      // fall through
    }
  }
  return request.method === "GET" ? "/api/v1/alexa-sim/health" : "/api/v1/alexa-sim/chat";
}
