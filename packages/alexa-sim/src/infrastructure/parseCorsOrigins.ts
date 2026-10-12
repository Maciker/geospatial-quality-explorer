const DEFAULT_LOCAL_ORIGINS = [
  "http://127.0.0.1:5173",
  "http://localhost:5173",
  "http://127.0.0.1:4173",
  "http://localhost:4173",
];

export function readAlexaSimCorsOrigins(): Set<string> {
  const configured = process.env.ALEXA_SIM_CORS_ORIGINS;
  if (!configured || configured.trim().length === 0) {
    return new Set(DEFAULT_LOCAL_ORIGINS);
  }
  return new Set(
    configured.split(",").map((origin) => origin.trim()).filter((origin) => origin.length > 0),
  );
}

export function corsHeadersForRequest(origin: string | undefined, allowed: Set<string>): Record<string, string> {
  if (!origin || !allowed.has(origin)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}
