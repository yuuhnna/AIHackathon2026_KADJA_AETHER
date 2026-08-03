// SEED DATA for the rehabilitation activity repository.
//
// These entries stand in for field-team submissions made before AETHER
// existed, so the Rehabilitation Activities page has history to show on a
// fresh install. Everything an officer logs from the Dashboard's Recommended
// Actions panel is stored separately in localStorage and merged on top of
// this list — see lib/activityStore.ts.
//
// The zone_ids/municipalities/statuses below ARE real (pulled from the live
// feature table's rehabilitation_status column) — only the per-activity
// timeline entries (dates, action category, recommendation text, officer)
// are invented. Replace this array with a fetch from a real activities
// endpoint when one exists; RehabActivity's shape is what that endpoint
// should return.
//
// Seed entries have no recommendation_text: they predate the recommendation
// engine, so they belong to a zone but not to any specific recommendation.

import type { RehabActivity } from "./types";

// Action categories match the rule-based engine's categories on the Data &
// Methodology page (Restoration, Protection & Enforcement, Monitoring,
// Climate Adaptation, Intervention Planning, Integrated Management) for
// consistency across the app.
export const SEED_ACTIVITIES: RehabActivity[] = [
  {
    id: "seed-1",
    zone_id: "ESTANCIA-0001",
    date: "2026-07-31",
    status: "Completed",
    action_category: "Restoration",
    recommendation_name: "Native mangrove replanting (site-appropriate species)",
    action_taken:
      "Planted 1,200 Rhizophora and Avicennia propagules along the seaward edge with community volunteers.",
    implementing_unit: "DENR",
    area_covered_ha: 2.5,
    officer_name: "Officer J. Villanueva",
    source: "seed",
  },
  {
    id: "seed-2",
    zone_id: "ESTANCIA-0001",
    date: "2026-06-14",
    status: "Completed",
    action_category: "Monitoring",
    recommendation_name: "Baseline vegetation health survey",
    action_taken:
      "Walked three transects and recorded canopy cover, stand density, and photo points.",
    implementing_unit: "MENRO",
    officer_name: "Officer R. Salcedo",
    source: "seed",
  },
  {
    id: "seed-3",
    zone_id: "ESTANCIA-0001",
    date: "2026-04-02",
    status: "Planned",
    action_category: "Restoration",
    recommendation_name: "Site suitability assessment for replanting",
    action_taken: "Scheduled substrate and tidal-range assessment ahead of the planting season.",
    implementing_unit: "DENR",
    officer_name: "Officer J. Villanueva",
    source: "seed",
  },
  {
    id: "seed-4",
    zone_id: "ANILAO-0001",
    date: "2026-07-31",
    status: "Active",
    action_category: "Protection & Enforcement",
    recommendation_name: "Increase monitoring frequency near access road",
    action_taken: "Weekly patrols established; signage installed at the two informal access points.",
    implementing_unit: "MENRO",
    officer_name: "Officer M. Fernandez",
    source: "seed",
  },
  {
    id: "seed-5",
    zone_id: "ANILAO-0001",
    date: "2026-05-20",
    status: "Completed",
    action_category: "Monitoring",
    recommendation_name: "Quarterly canopy-health assessment",
    action_taken: "Quarterly canopy assessment completed; no further decline observed.",
    implementing_unit: "MENRO",
    officer_name: "Officer M. Fernandez",
    source: "seed",
  },
  {
    id: "seed-6",
    zone_id: "ESTANCIA-0003",
    date: "2026-07-18",
    status: "Active",
    action_category: "Restoration",
    recommendation_name: "Assisted Natural Regeneration (ANR)",
    action_taken:
      "Cleared debris blocking natural recruitment and marked regeneration plots for follow-up.",
    implementing_unit: "CENRO",
    area_covered_ha: 3.2,
    officer_name: "Officer L. Domingo",
    source: "seed",
  },
  {
    id: "seed-7",
    zone_id: "ZARRAGA-0001",
    date: "2026-07-05",
    status: "Planned",
    action_category: "Restoration",
    recommendation_name: "Restore degraded vegetation, strengthen road-side enforcement",
    action_taken: "Restoration plan drafted with the barangay council; awaiting budget release.",
    implementing_unit: "LGU",
    officer_name: "Officer A. Reyes",
    source: "seed",
  },
  {
    id: "seed-8",
    zone_id: "CARLES-0001",
    date: "2026-06-28",
    status: "Planned",
    action_category: "Intervention Planning",
    recommendation_name: "Site suitability assessment before restoration",
    action_taken: "Assessment scoped and queued for the next field rotation.",
    implementing_unit: "PENRO",
    officer_name: "Officer P. Navarro",
    source: "seed",
  },
  {
    id: "seed-9",
    zone_id: "CARLES-0002",
    date: "2026-03-11",
    status: "Completed",
    action_category: "Restoration",
    recommendation_name: "Post-disturbance rehabilitation of storm-damaged stand",
    action_taken: "Removed downed timber and replanted gaps left by the storm surge.",
    implementing_unit: "DENR",
    area_covered_ha: 1.8,
    officer_name: "Officer P. Navarro",
    source: "seed",
  },
  {
    id: "seed-10",
    zone_id: "BANATE-0003",
    date: "2026-07-22",
    status: "Under Review",
    action_category: "Protection & Enforcement",
    recommendation_name: "Restore mangroves, mitigate nearby aquaculture pressure",
    action_taken:
      "Documented encroachment by two adjacent ponds; referred to the enforcement unit for review.",
    implementing_unit: "CENRO",
    officer_name: "Officer C. Mercado",
    source: "seed",
  },
  {
    id: "seed-11",
    zone_id: "ILOILOCITY-0003",
    date: "2026-07-27",
    status: "Under Review",
    action_category: "Integrated Management",
    recommendation_name: "Prioritise site for integrated conservation planning",
    action_taken:
      "Endorsed the site for inclusion in the city's coastal greenbelt management plan.",
    implementing_unit: "MENRO",
    officer_name: "Officer S. Aguirre",
    source: "seed",
  },
];
