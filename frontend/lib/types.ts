export interface SummaryStats {
  total_zones: number;
  total_area_ha?: number;
  max_area_loss_percent?: number;
  active_rehabilitation_count?: number;
}

export type RiskClass = "low" | "moderate" | "high";

export interface ZoneSummary {
  zone_id: string;
  lat: number;
  lon: number;
  vulnerability_score: number;
  risk_class: RiskClass;
}