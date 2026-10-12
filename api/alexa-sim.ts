import { handleAlexaSimHttp } from "../packages/alexa-sim/src/infrastructure/handleAlexaSimHttp.js";

type VercelRequest = {
  method?: string;
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
      pathname: "/api/v1/alexa-sim/chat",
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
