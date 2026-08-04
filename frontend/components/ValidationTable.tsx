"use client";

// The expert-validated rule table behind the recommendation engine, as
// shown on Data & Methodology: each driver, the action it triggers, and
// the field checks that must confirm it.

import { Fragment, useState } from "react";
import { ChevronDownIcon } from "@/components/icons";

type ValidationRow = {
  id: string;
  drivers: string;
  category: string;
  recommendation: string;
  fieldValidation: string[];
  expertNote: string | null;
  priority: "High" | "Mid" | "Low" | "Low to Mid";
};

const PRIORITY_CLASS: Record<ValidationRow["priority"], string> = {
  High: "bg-risk-high-badge text-white",
  Mid: "bg-risk-moderate-badge text-white",
  "Low to Mid": "bg-risk-moderate-badge text-white",
  Low: "bg-risk-low-badge text-white",
};

export const EXPERT_VALIDATION_ROWS: ValidationRow[] = [
  {
    id: "S1",
    drivers: "Low NDVI",
    category: "Restoration",
    recommendation: "Conduct native mangrove replanting using site-appropriate species.",
    fieldValidation: [
      "Confirm cause of vegetation decline",
      "Verify species suitability",
      "Assess natural regeneration",
    ],
    expertNote: null,
    priority: "Mid",
  },
  {
    id: "S2",
    drivers: "Low MVI",
    category: "Restoration",
    recommendation: "Implement Assisted Natural Regeneration (ANR) where feasible.",
    fieldValidation: [
      "Verify regeneration potential",
      "Assess existing seedling density",
      "Identify invasive species",
    ],
    expertNote: "Assess physico-chemical parameters of the area",
    priority: "Mid",
  },
  {
    id: "S3",
    drivers: "Distance to roads",
    category: "Protection & Enforcement",
    recommendation:
      "Increase monitoring frequency and strengthen enforcement against illegal activities.",
    fieldValidation: [
      "Confirm evidence of encroachment",
      "Assess accessibility",
      "Identify nearby human activities",
    ],
    expertNote: "Priority depends on actual use of the road",
    priority: "Low to Mid",
  },
  {
    id: "S4",
    drivers: "Distance to aquaculture",
    category: "Protection & Enforcement",
    recommendation:
      "Investigate aquaculture impacts and enforce environmental regulations where necessary.",
    fieldValidation: [
      "Verify encroachment",
      "Assess water quality",
      "Confirm ownership / legal status",
    ],
    expertNote: null,
    priority: "High",
  },
  {
    id: "S5",
    drivers: "Distance to river",
    category: "Restoration / Monitoring",
    recommendation:
      "Implement riverbank protection or riparian rehabilitation where appropriate.",
    fieldValidation: [
      "Assess erosion severity",
      "Verify hydrological condition",
      "Inspect sediment deposition",
    ],
    expertNote: null,
    priority: "High",
  },
  {
    id: "S6",
    drivers: "High annual temperature",
    category: "Climate Adaptation",
    recommendation: "Increase ecological monitoring and implement climate adaptation measures.",
    fieldValidation: [
      "Verify vegetation stress",
      "Assess drought symptoms",
      "Identify affected species",
    ],
    expertNote: null,
    priority: "Mid",
  },
  {
    id: "S7",
    drivers: "Low / high annual precipitation",
    category: "Monitoring",
    recommendation: "Intensify monitoring during abnormal rainfall periods.",
    fieldValidation: [
      "Assess flooding / drought impacts",
      "Verify soil moisture",
      "Inspect mangrove condition",
    ],
    expertNote: null,
    priority: "Mid",
  },
  {
    id: "S8",
    drivers: "High wind speed",
    category: "Restoration",
    recommendation: "Conduct post-disturbance rehabilitation of damaged mangrove stands.",
    fieldValidation: ["Confirm storm damage", "Assess tree mortality", "Identify unstable areas"],
    expertNote: null,
    priority: "Low",
  },
  {
    id: "S9",
    drivers: "Low elevation",
    category: "Intervention Planning",
    recommendation: "Prioritise site suitability assessment before restoration.",
    fieldValidation: ["Verify tidal inundation", "Assess salinity", "Confirm planting suitability"],
    expertNote: null,
    priority: "Low",
  },
  {
    id: "S10",
    drivers: "High slope",
    category: "Intervention Planning",
    recommendation: "Implement erosion mitigation measures before restoration activities.",
    fieldValidation: [
      "Assess slope stability",
      "Inspect erosion sign",
      "Identify sediment movement",
    ],
    expertNote: null,
    priority: "Low",
  },
  {
    id: "S11",
    drivers: "Low NDVI + near road",
    category: "Restoration + Protection",
    recommendation: "Restore degraded vegetation while strengthening protection measures.",
    fieldValidation: [
      "Confirm degradation source",
      "Verify illegal activities",
      "Assess restoration feasibility",
    ],
    expertNote: null,
    priority: "High",
  },
  {
    id: "S12",
    drivers: "Low NDVI + aquaculture",
    category: "Restoration + Enforcement",
    recommendation: "Restore mangroves and mitigate nearby anthropogenic pressures.",
    fieldValidation: ["Verify aquaculture impacts", "Assess pollution", "Confirm restoration suitability"],
    expertNote: null,
    priority: "High",
  },
  {
    id: "S13",
    drivers: "Multiple high-impact drivers",
    category: "Integrated Management",
    recommendation:
      "Prioritise the site for integrated conservation planning involving restoration, monitoring, and enforcement.",
    fieldValidation: [
      "Conduct comprehensive field assessment",
      "Validate all major degradation drivers",
      "Prioritise interventions",
    ],
    expertNote: null,
    priority: "High",
  },
];

export default function ValidationTable({ rows }: { rows: ValidationRow[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto -mx-4.5 px-4.5">
      <table className="w-full min-w-[720px] border-collapse text-[12px]">
        <thead>
          <tr className="text-left text-[10.5px] uppercase tracking-wider text-faint border-b border-line">
            <th className="py-2 pr-3 font-medium w-14">ID</th>
            <th className="py-2 pr-3 font-medium">Driver(s)</th>
            <th className="py-2 pr-3 font-medium">Category</th>
            <th className="py-2 pr-3 font-medium w-24">Priority</th>
            <th className="py-2 pr-3 font-medium w-28">Expert sign-off</th>
            <th className="py-2 w-8" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isOpen = openId === row.id;
            return (
              <Fragment key={row.id}>
                <tr
                  onClick={() => setOpenId(isOpen ? null : row.id)}
                  tabIndex={0}
                  role="button"
                  aria-expanded={isOpen}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setOpenId(isOpen ? null : row.id);
                    }
                  }}
                  className="cursor-pointer border-b border-line-soft hover:bg-bg-panel-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                >
                  <td className="py-2.5 pr-3 font-mono text-faint">{row.id}</td>
                  <td className="py-2.5 pr-3 text-ink font-medium">{row.drivers}</td>
                  <td className="py-2.5 pr-3 text-muted">{row.category}</td>
                  <td className="py-2.5 pr-3">
                    <span className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] ${PRIORITY_CLASS[row.priority]}`}>
                      {row.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] bg-bg-panel-alt border border-line text-faint">
                      PENDING
                    </span>
                  </td>
                  <td className="py-2.5 text-faint">
                    <ChevronDownIcon className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                  </td>
                </tr>
                {isOpen && (
                  <tr key={`${row.id}-detail`} className="border-b border-line-soft bg-bg-panel-alt/60">
                    <td colSpan={6} className="py-3 px-3">
                      <div className="text-[12.5px] text-ink font-medium mb-2">{row.recommendation}</div>
                      <div className="text-[10.5px] uppercase tracking-wider text-faint mb-1.5">
                        Field validation required
                      </div>
                      <ul className="grid sm:grid-cols-3 gap-x-4 gap-y-1 mb-2">
                        {row.fieldValidation.map((item) => (
                          <li key={item} className="flex items-start gap-1.5 text-[12px] text-muted">
                            <span
                              className="mt-1 w-2.5 h-2.5 rounded-[3px] border border-faint shrink-0"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {row.expertNote && (
                        <div className="text-[12px] text-accent">
                          <span className="font-semibold">Expert note: </span>
                          {row.expertNote}
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
