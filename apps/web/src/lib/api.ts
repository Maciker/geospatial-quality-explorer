export type FeatureCollection = {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    geometry: unknown;
    properties: Record<string, unknown> | null;
  }>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export async function getFindings(): Promise<FeatureCollection> {
  const response = await fetch(`${API_BASE_URL}/api/v1/findings`);
  if (!response.ok) {
    throw new Error(`Could not load findings: ${response.status}`);
  }
  return response.json() as Promise<FeatureCollection>;
}
