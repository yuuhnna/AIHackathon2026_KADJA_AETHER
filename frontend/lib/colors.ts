import type { RiskClass } from "@/lib/types";

export const RISK_COLOR: Record<RiskClass, string> = {
  low: "#22B573",
  moderate: "#C8890B",
  high: "#D14343",
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