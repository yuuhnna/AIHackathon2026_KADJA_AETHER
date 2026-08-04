/**
 * Classifies a recommendation string from the backend's rule engine into a
 * short headline and an action category.
 *
 * The engine (backend/app/services/recommendation_service.py) returns full
 * prose sentences and no identifier, so the mapping below keys off a
 * distinctive fragment of each rule's text. Each MATCH string is a verbatim
 * substring of one rule in recommendation_service.py — if a rule's wording
 * changes there, update it here too, or that recommendation quietly falls
 * through to the generic branch (it stays usable, just without its specific
 * title and category).
 *
 * Categories match the vocabulary documented on the Data & Methodology page
 * (see ValidationTable.tsx), so an action logged from a recommendation is
 * filed under the same category the recommendation itself belongs to.
 */

import type { ActionCategory, ZoneRawFeatures, ZoneSummary } from "./types";
import { FEATURE_LABELS } from "./colors";

export interface ClassifiedRecommendation {
  /** Short headline for list rows and the rehabilitation timeline. */
  title: string;
  category: ActionCategory;
  /**
   * Checks a field team should complete before logging this action. These
   * gate the log form — an entry can't be saved until all are confirmed.
   */
  fieldContext: string[];
  /** False when no rule matched and the generic fallback was used. */
  matched: boolean;
}

interface RecommendationRule {
  match: string;
  title: string;
  category: ActionCategory;
  fieldContext: string[];
  /**
   * The feature whose value tripped this rule, and the direction that did
   * it. Used to describe the driver from the zone's own data rather than
   * restating the rule. Omitted for rules driven by overall risk instead
   * of a single feature.
   */
  driver?: { feature: keyof ZoneRawFeatures; sense: "low" | "high" };
}

const RULES: RecommendationRule[] = [
  {
    match: "Prioritize for field validation",
    title: "Field validation and immediate monitoring",
    category: "Monitoring",
    fieldContext: [
      "Confirm site access and zone boundaries",
      "Verify current canopy condition on site",
      "Record baseline photo evidence",
    ],
  },
  {
    match: "Review nearby aquaculture activities",
    title: "Aquaculture buffer-zone compliance review",
    category: "Protection & Enforcement",
    driver: { feature: "nearest_aquaculture_distance_m", sense: "low" },
    fieldContext: [
      "Identify adjacent aquaculture operators",
      "Verify buffer-zone compliance",
      "Check permit status with the LGU",
    ],
  },
  {
    match: "Conduct vegetation health assessment",
    title: "Vegetation health follow-up survey",
    category: "Monitoring",
    driver: { feature: "mean_ndvi", sense: "low" },
    fieldContext: [
      "Confirm degradation source",
      "Verify illegal activities",
      "Assess restoration feasibility",
    ],
  },
  {
    match: "Assess mangrove stand condition",
    title: "Mangrove stand condition investigation",
    category: "Monitoring",
    driver: { feature: "mean_mvi", sense: "low" },
    fieldContext: [
      "Confirm species composition on site",
      "Distinguish mangrove from associated vegetation",
      "Assess stand density and canopy gaps",
    ],
  },
  {
    match: "erosion-control and restoration strategies",
    title: "Erosion control and inundation-resilient replanting",
    category: "Climate Adaptation",
    driver: { feature: "mean_elevation", sense: "low" },
    fieldContext: [
      "Confirm tidal inundation range",
      "Assess shoreline erosion at the seaward edge",
      "Verify species suitability for inundation",
    ],
  },
  {
    match: "Limited freshwater connectivity",
    title: "Hydrological restoration assessment",
    category: "Restoration",
    driver: { feature: "nearest_river_distance_m", sense: "high" },
    fieldContext: [
      "Trace the nearest freshwater inflow",
      "Check for obstructions or diversions",
      "Measure salinity at the site",
    ],
  },
  {
    match: "Maintain routine monitoring cadence",
    title: "Routine monitoring cadence",
    category: "Monitoring",
    fieldContext: [
      "Confirm no new disturbance since the last visit",
      "Record current canopy condition",
      "Schedule the next monitoring window",
    ],
  },
  {
    match: "Continue routine monitoring",
    title: "Next scheduled monitoring cycle",
    category: "Intervention Planning",
    fieldContext: [
      "Confirm zone boundaries with the field team",
      "Identify the dominant pressure on site",
      "Schedule the assessment visit",
    ],
  },
];

/** Applied when no rule matches, so every recommendation is still gated. */
const FALLBACK_FIELD_CONTEXT = [
  "Confirm the finding on site",
  "Identify the responsible implementing unit",
  "Document baseline condition",
];

const FALLBACK_TITLE_MAX_LENGTH = 64;

/**
 * Derives a headline from unrecognised recommendation text: the first clause,
 * truncated on a word boundary. Used only when no rule above matches.
 */
function deriveTitle(text: string): string {
  const firstClause = text.split(/[—;.]/)[0].trim();
  const source = firstClause.length > 0 ? firstClause : text.trim();
  if (source.length <= FALLBACK_TITLE_MAX_LENGTH) return source;

  const clipped = source.slice(0, FALLBACK_TITLE_MAX_LENGTH);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > 0 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

export function classifyRecommendation(text: string): ClassifiedRecommendation {
  const rule = RULES.find((r) => text.includes(r.match));
  if (rule) {
    return {
      title: rule.title,
      category: rule.category,
      fieldContext: rule.fieldContext,
      matched: true,
    };
  }
  return {
    title: deriveTitle(text),
    category: "Intervention Planning",
    fieldContext: FALLBACK_FIELD_CONTEXT,
    matched: false,
  };
}

/** Distances read better in km once they run to thousands of metres. */
function formatFeatureValue(feature: keyof ZoneRawFeatures, value: number): string {
  if (feature.endsWith("_distance_m")) {
    return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
  }
  if (feature === "mean_elevation") return `${value.toFixed(1)} m`;
  return value.toFixed(2);
}

const DRIVER_PHRASE: Record<string, { low: string; high: string }> = {
  mean_ndvi: { low: "Low NDVI", high: "High NDVI" },
  mean_mvi: { low: "Low MVI", high: "High MVI" },
  mean_elevation: { low: "Low elevation", high: "High elevation" },
  nearest_aquaculture_distance_m: {
    low: "Near aquaculture",
    high: "Far from aquaculture",
  },
  nearest_river_distance_m: {
    low: "Near freshwater",
    high: "Far from freshwater",
  },
};

/**
 * Describes why this recommendation fired, using the zone's own measured
 * values rather than restating the rule. Falls back to the zone's strongest
 * contributing factor for rules that key off overall risk instead of one
 * feature.
 */
export function describeDriver(text: string, zone: ZoneSummary): string {
  const rule = RULES.find((r) => text.includes(r.match));

  if (rule?.driver) {
    const { feature, sense } = rule.driver;
    const value = zone.raw_features?.[feature];
    const phrase = DRIVER_PHRASE[feature]?.[sense] ?? FEATURE_LABELS[feature] ?? feature;
    return typeof value === "number"
      ? `${phrase} (${formatFeatureValue(feature, value)})`
      : phrase;
  }

  // Risk-driven rules: name the factor the model leaned on hardest.
  const strongest = [...zone.top_factors].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value)
  )[0];
  const riskLabel = `${zone.risk_class.charAt(0).toUpperCase()}${zone.risk_class.slice(1)} risk`;
  return strongest ? `${riskLabel} · ${strongest.label}` : riskLabel;
}

/** Neutral outline pills — category is metadata, not a severity signal. */
export const ACTION_CATEGORY_PILL_CLASS: Record<ActionCategory, string> = {
  Restoration: "bg-risk-low/10 text-risk-low border border-risk-low/25",
  "Protection & Enforcement": "bg-risk-high/10 text-risk-high border border-risk-high/25",
  Monitoring: "bg-accent/10 text-accent border border-accent/25",
  "Climate Adaptation": "bg-risk-moderate/10 text-risk-moderate border border-risk-moderate/25",
  "Intervention Planning": "bg-bg-panel-alt text-muted border border-line",
  "Integrated Management": "bg-bg-panel-alt text-muted border border-line",
};
