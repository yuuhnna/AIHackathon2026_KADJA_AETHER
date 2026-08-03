import type {
  ZoneSummary,
  SummaryStats,
  FeatureImportanceItem,
  ModelMetrics
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`API request failed: ${path} (${res.status})`);
  }
  return res.json();
}

export function fetchFeatureImportance(): Promise<FeatureImportanceItem[]> {
  return getJSON<FeatureImportanceItem[]>("/api/feature-importance");
}

export async function fetchModelMetrics(): Promise<ModelMetrics> {
    const response = await fetch(`${API_BASE}/api/model-metrics`);

    if (!response.ok) {
        throw new Error("Failed to fetch model metrics.");
    }

    return await response.json();
}