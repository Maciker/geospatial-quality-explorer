export type FeatureCollection = {
  type: "FeatureCollection";
  features: GeoJSON.Feature[];
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function getFindings(): Promise<FeatureCollection> {
  const response = await fetch(`${API_BASE_URL}/api/v1/findings`);
  if (!response.ok) {
    throw new Error(`Could not load findings: ${response.status}`);
  }
  return response.json() as Promise<FeatureCollection>;
}
