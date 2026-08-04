// lib/recommendationRules.ts
//
// AETHER's recommendation engine is a fixed, PENRO Guimaras-validated
// rule table (see Data & Model Methodology docs). The backend's /zones/{id}
// endpoint returns each matched recommendation as a plain string — it does
// not (and doesn't need to) send category/driver/checklist data, since that
// mapping never changes at runtime. We resolve it here instead.

export interface RecommendationRule {
  driver: string;
  category: string;
  text: string;
  validationPoints: string[];
}

export const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    driver: "High Risk",
    category: "Monitoring",
    text: "Prioritize for field validation and immediate monitoring — high predicted vulnerability warrants on-site assessment.",
    validationPoints: ["Confirm site access and zone boundaries", "Verify current canopy condition on site", "Record baseline photo evidence"],
  },
  {
    driver: "Low NDVI",
    category: "Restoration",
    text: "Conduct vegetation health assessment; low NDVI may indicate canopy stress.",
    validationPoints: ["Confirm cause of vegetation decline", "Verify species suitability", "Assess natural regeneration"],
  },
  {
    driver: "Low MVI",
    category: "Restoration",
    text: "Assess mangrove stand condition; low MVI may indicate degradation.",
    validationPoints: ["Verify regeneration potential", "Assess existing seedling density", "Identify invasive species"],
  },
  {
    driver: "Distance to Roads",
    category: "Protection & Enforcement",
    text: "Increase monitoring frequency and strengthen enforcement against illegal activities.",
    validationPoints: ["Confirm evidence of encroachment", "Assess accessibility", "Identify nearby human activities"],
  },
  {
    driver: "Distance to Aquaculture",
    category: "Protection & Enforcement",
    text: "Review nearby aquaculture activities for possible land conversion pressure and buffer-zone compliance.",
    validationPoints: ["Verify encroachment", "Assess water quality", "Confirm ownership / legal status"],
  },
  {
    driver: "Distance to River",
    category: "Restoration / Monitoring",
    text: "Limited freshwater connectivity may be constraining recovery; evaluate hydrological restoration options.",
    validationPoints: ["Assess erosion severity", "Verify hydrological condition", "Inspect sediment deposition"],
  },
  {
    driver: "High Annual Temperature",
    category: "Climate Adaptation",
    text: "Increase ecological monitoring and implement climate adaptation measures.",
    validationPoints: ["Verify vegetation stress", "Assess drought symptoms", "Identify affected species"],
  },
  {
    driver: "Low / High Annual Precipitation",
    category: "Monitoring",
    text: "Intensify monitoring during abnormal rainfall periods.",
    validationPoints: ["Assess flooding / drought impacts", "Verify soil moisture", "Inspect mangrove condition"],
  },
  {
    driver: "High Wind Speed",
    category: "Restoration",
    text: "Conduct post-disturbance rehabilitation of damaged mangrove stands.",
    validationPoints: ["Confirm storm damage", "Assess tree mortality", "Identify unstable areas"],
  },
  {
    driver: "Low Elevation",
    category: "Intervention Planning",
    text: "Evaluate erosion-control and restoration strategies for low elevation areas.",
    validationPoints: ["Verify tidal inundation", "Assess salinity", "Confirm planting suitability"],
  },
  {
    driver: "High Slope",
    category: "Intervention Planning",
    text: "Implement erosion mitigation measures before restoration activities.",
    validationPoints: ["Assess slope stability", "Inspect erosion signs", "Identify sediment movement"],
  },
  {
    driver: "Low NDVI + Near Road",
    category: "Restoration + Protection",
    text: "Restore degraded vegetation while strengthening protection measures.",
    validationPoints: ["Confirm degradation source", "Verify illegal activities", "Assess restoration feasibility"],
  },
  {
    driver: "Low NDVI + Aquaculture",
    category: "Restoration + Enforcement",
    text: "Restore mangroves and mitigate nearby anthropogenic pressures.",
    validationPoints: ["Verify aquaculture impacts", "Assess pollution", "Confirm restoration suitability"],
  },
  {
    driver: "Multiple High-Impact Drivers",
    category: "Integrated Management",
    text: "Prioritise the site for integrated conservation planning involving restoration, monitoring, and enforcement.",
    validationPoints: ["Conduct comprehensive field assessment", "Validate all major degradation drivers", "Prioritise interventions"],
  },
  {
    driver: "Low Risk",
    category: "Monitoring",
    text: "Maintain routine monitoring cadence; no elevated-risk drivers identified in the current assessment window.",
    validationPoints: ["Confirm no new disturbance since the last visit", "Record current canopy condition", "Schedule the next monitoring window"],
  },
  {
    driver: "General",
    category: "Intervention Planning",
    text: "Continue routine monitoring; no dominant environmental drivers requiring immediate intervention were identified.",
    validationPoints: ["Confirm zone boundaries with the field team", "Identify the dominant pressure on site", "Schedule the assessment visit"],
  },
];

const FALLBACK_VALIDATION_POINTS = [
  "Confirm site conditions match this recommendation",
  "Verify recommendation is still applicable",
  "Document field observations",
];

/**
 * Matches a plain recommendation string from the backend to its known
 * rule (category, driver, checklist). Falls back to a generic checklist
 * if the text doesn't match the table exactly — this can happen if the
 * backend's rule engine text changes without this table being updated,
 * so treat a fallback match as a signal to sync this file, not a bug to
 * silently swallow.
 */
export function resolveRecommendation(text: string): RecommendationRule {
  const match = RECOMMENDATION_RULES.find((r) => r.text === text);
  if (match) return match;

  return {
    driver: "Unspecified",
    category: "General",
    text,
    validationPoints: FALLBACK_VALIDATION_POINTS,
  };
}