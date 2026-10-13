export type Severity = "error" | "warning" | "info";

export type GeoJsonGeometry =
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };

export type FindingFeature = {
  type: "Feature";
  id: string;
  geometry: GeoJsonGeometry | null;
  properties: {
    findingId: string;
    ruleId: string;
    severity: Severity;
    featureId: string;
    explanation: string;
    suggestedAction: string;
  };
};

export type FindingCollection = {
  type: "FeatureCollection";
  runId: string;
  features: FindingFeature[];
  nextCursor: string | null;
};

export type RunSummary = {
  runId: string;
  datasetName: string;
  sourceHash: string;
  sourceCrs: string;
  license: string;
  rulesetId: string;
  rulesetVersion: string;
  status: string;
  limitations: string[];
  findingCount: number;
};

export type ImportJob = {
  jobId: string;
  status: "pending" | "running" | "succeeded" | "failed" | "cancelled";
  runId: string | null;
  message: string | null;
};

export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function getRun(runId: string): Promise<RunSummary> {
  return request(`/api/v1/runs/${runId}`);
}

export async function getFindings(runId: string, search: URLSearchParams): Promise<FindingCollection> {
  const query = new URLSearchParams();
  for (const key of ["severity", "ruleId", "bbox", "limit", "cursor"]) {
    const value = search.get(key);
    if (value) query.set(key, value);
  }
  const suffix = query.size > 0 ? `?${query.toString()}` : "";
  return request(`/api/v1/runs/${runId}/findings${suffix}`);
}

export async function importDataset(body: {
  datasetName: string;
  sourceCrs: string;
  license: string;
  /** Original file text, so the source hash matches `pnpm gis validate` on the same file. */
  geojson: string;
}): Promise<ImportJob> {
  return request("/api/v1/imports", { method: "POST", body: JSON.stringify(body) });
}

export async function getJob(jobId: string): Promise<ImportJob> {
  return request(`/api/v1/jobs/${jobId}`);
}

export async function cancelJob(jobId: string): Promise<ImportJob> {
  return request(`/api/v1/jobs/${jobId}/cancel`, { method: "POST" });
}

async function request<T>(path: string, init?: { method?: string; body?: string }): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: init?.method ?? "GET",
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null;
    throw new ApiError(payload?.message ?? `Request failed with ${response.status}`, response.status);
  }
  return response.json() as Promise<T>;
}
