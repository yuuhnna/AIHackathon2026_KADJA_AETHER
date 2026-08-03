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

export function fetchModelMetrics(): Promise<ModelMetrics> {
  return getJSON<ModelMetrics>("/api/model-metrics");
}

// Shape actually returned by /zones today. risk_class and confidence_flag
// are optional here since older backend builds (before that logic was
// added to zone_service.py) won't include them yet.
interface BackendZoneSummary {
  zone_id: string;
  lat: number;
  lon: number;
  vulnerability_score: number;
  municipality: string;
  expected_area_loss: number;
  risk_class?: "low" | "moderate" | "high";
  confidence_flag?: string;
}

// The backend doesn't yet provide top_factors, recommendations, or
// rehabilitation_status — this fills them with safe defaults so
// DetailPanel and ZoneTable don't crash reading undefined fields, until
// those are added backend-side.
function toFrontendZone(z: BackendZoneSummary): ZoneSummary {
  return {
    zone_id: z.zone_id,
    lat: z.lat,
    lon: z.lon,
    vulnerability_score: z.vulnerability_score,
    municipality: z.municipality,
    expected_area_loss: z.expected_area_loss,
    risk_class: z.risk_class ?? "low",
    confidence_flag: z.confidence_flag ?? "ok",
    top_factors: [],
    recommendations: [],
    rehabilitation_status: "None",
  };
}

export async function fetchZones(): Promise<ZoneSummary[]> {
  const data = await getJSON<BackendZoneSummary[]>("/zones");
  return data.map(toFrontendZone);
}