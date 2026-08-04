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
    driver: "Low NDVI",
    category: "Restoration",
    text: "Conduct native mangrove replanting using site-appropriate species.",
    validationPoints: ["Confirm cause of vegetation decline", "Verify species suitability", "Assess natural regeneration"],
  },
  {
    driver: "Low MVI",
    category: "Restoration",
    text: "Implement Assisted Natural Regeneration (ANR) where feasible.",
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
    text: "Investigate aquaculture impacts and enforce environmental regulations where necessary.",
    validationPoints: ["Verify encroachment", "Assess water quality", "Confirm ownership / legal status"],
  },
  {
    driver: "Distance to River",
    category: "Restoration / Monitoring",
    text: "Implement riverbank protection or riparian rehabilitation where appropriate.",
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
    text: "Prioritise site suitability assessment before restoration.",
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