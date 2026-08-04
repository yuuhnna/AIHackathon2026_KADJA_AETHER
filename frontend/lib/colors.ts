import type { RiskClass } from "@/lib/types";

export const RISK_COLOR: Record<RiskClass, string> = {
  low: "#22B573",
  moderate: "#C8890B",
  high: "#D14343",
};

// Fill colours for the zone map only — deliberately NOT the same palette
// as RISK_COLOR above.
//
// The map answers one question: where does a field team go next. So it
// paints the mangroves as mangroves (one green for everything that is
// not a priority) and burns only the Top 10% in vivid red on top of
// them. Giving Next 20% its own colour there would put a third alert
// tone on the map and blunt the one signal it exists to carry.
//
// Everywhere text names a tier — the legend, the table pills, the
// detail panel, the map tooltip — RISK_COLOR still applies, so Next 20%
// stays amber when you read it or press it. Only the painted area is
// green.
export const ZONE_FILL_COLOR: Record<RiskClass, string> = {
  low: "#22B573",
  moderate: "#22B573",
  high: "#FF2D1A",
};

// Solid risk pills (white text on a saturated risk color) — shared by
// ZoneTable (Dashboard) and the Rehabilitation Activities pages.
export const RISK_PILL_CLASS: Record<RiskClass, string> = {
  low: "bg-risk-low text-white",
  moderate: "bg-risk-moderate text-white",
  high: "bg-risk-high text-white",
};

// Matches the real rehabilitation_status values in the feature table.
// Shared by ZoneTable (Dashboard) and the Rehabilitation Activities pages
// so the same status always renders with the same pill everywhere.
export const REHAB_STATUS_PILL_CLASS: Record<string, string> = {
  Active: "bg-accent/15 text-accent border border-accent/30",
  Planned: "bg-bg-panel-alt border border-line text-muted",
  Completed: "bg-risk-low/15 text-risk-low border border-risk-low/30",
  "Under Review": "bg-risk-moderate/15 text-risk-moderate border border-risk-moderate/30",
  None: "bg-bg-panel-alt border border-line-soft text-faint",
};

// Severity rank for sorting — higher number = more urgent. Used by the
// Rehabilitation Activities repository table's "Risk" column sort.
export const RISK_SORT_ORDER: Record<RiskClass, number> = {
  low: 0,
  moderate: 1,
  high: 2,
};


export const FEATURE_LABELS: Record<string, string> = {
  mean_ndvi: "Vegetation health (NDVI)",
  mean_mvi: "Mangrove-specific vegetation (MVI)",
  mean_temperature: "Mean air temperature",
  annual_precipitation: "Annual precipitation",
  mean_wind_speed: "Mean wind exposure",
  mean_elevation: "Elevation above sea level",
  mean_slope: "Terrain slope",
  nearest_aquaculture_distance_m: "Proximity to aquaculture",
  nearest_river_distance_m: "Proximity to rivers",
};

export const RISK_LABEL: Record<RiskClass, string> = {
  high: "Top 10%",
  moderate: "Next 20%",
  low: "Remaining 70%",
};

// Same wording as the Input Features section on the Data & Methodology
// page — kept here so it can also back the feature-importance hover
// tooltips without duplicating the copy in two places.
export const FEATURE_DESCRIPTIONS: Record<string, string> = {
  mean_ndvi:
    "General canopy greenness and vigor, derived from Sentinel-2 reflectance. Sensitive to vegetation stress before it becomes visible on the ground.",
  mean_mvi:
    "A mangrove-specific vegetation index — distinguishes mangrove stand condition from general greenness, which NDVI alone can't do.",
  mean_temperature:
    "Mean air temperature for the zone. Sustained heat stress is linked to canopy dieback.",
  annual_precipitation:
    "Total annual rainfall. Both prolonged deficit and abnormal excess are associated with mangrove stress.",
  mean_wind_speed:
    "Average wind speed. Higher exposure raises physical storm-damage risk to mangrove stands.",
  mean_elevation:
    "Height above sea level. Low-elevation zones face greater tidal inundation and flood exposure.",
  mean_slope: "Steepness of terrain. Steeper slopes are more prone to erosion and sediment loss.",
  nearest_aquaculture_distance_m:
    "Distance to the nearest aquaculture site. Closer proximity indicates higher land-conversion pressure.",
  nearest_river_distance_m:
    "Distance to the nearest river. Affects freshwater and sediment connectivity important for recovery.",
};