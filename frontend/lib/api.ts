import type {
  ZoneSummary,
  SummaryStats,
  FeatureImportanceItem,
  ModelMetrics,
  ErrorByRangeItem,
  ZoneAssessmentPayload
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
  return getJSON<FeatureImportanceItem[]>("/feature-importance");
}

export function fetchModelMetrics(): Promise<ModelMetrics> {
  return getJSON<ModelMetrics>("/model-metrics");
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

interface BackendSummaryResponse {
  total_mangrove_zones: number;
  total_mangrove_area_ha: number;
  highest_predicted_area_loss_pct: number;
  active_rehabilitation_initiatives: number;
}

export async function fetchSummary(): Promise<SummaryStats> {
  const data = await getJSON<BackendSummaryResponse>("/summary");
  return {
    total_zones: data.total_mangrove_zones,
    total_area_ha: data.total_mangrove_area_ha,
    max_area_loss_percent: data.highest_predicted_area_loss_pct,
    active_rehabilitation_count: data.active_rehabilitation_initiatives,
  };
}

// Shape returned by GET /zones/{zone_id} — richer than the bulk list,
// with real SHAP-derived contributing factors and rule-based
// recommendations (both only computed per-zone, not in bulk, since
// running SHAP across all 1,332 zones at once was too expensive).
interface BackendContributingFactor {
  feature: string;
  label: string;
  shap_value: number;
  direction: "increases" | "decreases";
}

interface BackendZoneDetail extends BackendZoneSummary {
  raw_features: Record<string, number | null>;
  top_factors: BackendContributingFactor[];
  recommendations: string[];
}

function toFrontendZoneDetail(z: BackendZoneDetail): ZoneSummary {
  return {
    ...toFrontendZone(z),
    // Backend's ContributingFactor uses shap_value/feature/direction;
    // the frontend's ZoneFactor is just { label, value } — DetailPanel
    // derives the increase/decrease arrow from the sign of value itself,
    // so shap_value maps directly without needing direction separately.
    top_factors: z.top_factors.map((f) => ({
      label: f.label,
      value: f.shap_value,
    })),
    recommendations: z.recommendations,
  };
}

export async function fetchZoneDetail(zoneId: string): Promise<ZoneSummary> {
  const data = await getJSON<BackendZoneDetail>(`/zones/${zoneId}`);
  return toFrontendZoneDetail(data);
}

interface BackendErrorByRangeItem {
  range: string;
  sample_size: number;
  mae: number;
  error_min: number;
  error_max: number;
}

export async function fetchErrorBySeverity(): Promise<ErrorByRangeItem[]> {
  const data = await getJSON<BackendErrorByRangeItem[]>("/error-by-severity");
  return data.map((item) => ({
    range: item.range,
    sampleSize: item.sample_size,
    mae: item.mae,
    errorMin: item.error_min,
    errorMax: item.error_max,
  }));
}

export async function submitZoneAssessment(
  zoneId: string,
  recommendationIndex: number,
  payload: ZoneAssessmentPayload & { recommendation_text?: string }
): Promise<void> {
  const { submitAssessmentToSupabase } = await import("./supabaseActivityStore");
  await submitAssessmentToSupabase(zoneId, recommendationIndex, payload);
}
 
