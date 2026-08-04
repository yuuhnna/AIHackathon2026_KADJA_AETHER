export interface SummaryStats {
  total_zones: number;
  total_area_ha?: number;
  max_area_loss_percent?: number;
  active_rehabilitation_count?: number;
}

export type RiskClass = "low" | "moderate" | "high";

export interface ZoneFactor {
  label: string;
  value: number;
}

export interface ZoneRawFeatures {
  mean_ndvi?: number;
  mean_mvi?: number;
  mean_temperature?: number;
  annual_precipitation?: number;
  mean_wind_speed?: number;
  mean_elevation?: number;
  mean_slope?: number;
  nearest_aquaculture_distance_m?: number;
  nearest_river_distance_m?: number;
}

export interface ZoneSummary {
  zone_id: string;
  lat: number;
  lon: number;
  vulnerability_score: number;
  risk_class: RiskClass;
  confidence_flag: string;
  municipality: string;
  expected_area_loss: number;
  rehabilitation_status: string;
  top_factors: ZoneFactor[];
  raw_features?: ZoneRawFeatures;
  /** Recommended conservation actions for this zone, ranked by priority. */
  recommendations: string[];
}

export interface FeatureImportanceItem {
  feature: string;
  label: string;
  importance: number;
}

// Rehabilitation activity log — one entry per conservation action a field
// team has committed to for a zone. Entries originate either from the seed
// repository (see lib/mockRehabilitation.ts) or from an officer logging a
// Recommended Action on the Dashboard.
export type RehabStatus = "Planned" | "Active" | "Under Review" | "Completed";

export const REHAB_STATUSES: readonly RehabStatus[] = [
  "Planned",
  "Active",
  "Under Review",
  "Completed",
] as const;

export interface RehabActivity {
  id: string;
  zone_id: string;
  date: string; // ISO yyyy-mm-dd (date only — no time component)
  status: RehabStatus;
  action_category: string;
  /** Short human-readable headline for the action. */
  recommendation_name: string;
  /**
   * The verbatim recommendation text from the backend's rule engine.
   * Present only on logged entries — it's the key that groups a
   * recommendation's entries into its own history.
   */
  recommendation_text?: string;
  /** What the field team actually did. Logged entries only. */
  action_taken?: string;
  /** Which body carried out the work. Logged entries only. */
  implementing_unit?: string;
  /** Hectares treated, as reported. Never derived or predicted by AETHER. */
  area_covered_ha?: number;
  /** Free-text pointer to supporting evidence (photo set, report no.). */
  evidence_ref?: string;
  /** Optional — field work is often logged against a unit, not a person. */
  officer_name?: string;
  source: "seed" | "logged";
}

export interface ModelMetrics {
  mae: number | null;
  rmse: number | null;
  r2: number | null;
  confidence_score: number | null;

  dataset?: {
    samples: number;
    features: number;
  };

  model?: {
    name: string;
    version: string;
  };
}

export interface ErrorByRangeItem {
  range: string;      
  sampleSize: number;
  mae: number;         // mean absolute error within this bin, hectares
  errorMin: number;    // smallest observed error in this bin
  errorMax: number;    // largest observed error in this bin
}

export interface ZoneRecommendation {
  category: string;          // e.g. "Restoration", "Protection & Enforcement"
  driver: string;             // e.g. "Low NDVI"
  text: string;                // the recommendation itself
  validationPoints: string[]; // field validation checklist for this recommendation
  lastAssessment?: {
    date: string;
    status: "Planned" | "Ongoing" | "Completed";
    unit: string;
  } | null;
}

export interface ZoneAssessmentPayload {
  date: string;
  status: "Planned" | "Ongoing" | "Completed";
  unit: string;
  officer?: string;
  action: string;
  areaHa?: number;
  evidenceRef?: string;
  notes?: string;
  validatedItems: string[]; // checklist items confirmed at the time of logging
}
