"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ZoneSummary } from "@/lib/types";
import {
  selectRecommendationHistory,
  selectZoneActivities,
  useActivities,
} from "@/lib/activityStore";
import { ACTION_CATEGORY_PILL_CLASS, classifyRecommendation, describeDriver } from "@/lib/recommendations";
import RecommendationsDialog from "@/components/RecommendationsDialog";
import { CheckCircleIcon, ChevronRightIcon } from "@/components/icons";

export default function RecommendedActions({ zone }: { zone: ZoneSummary }) {
  const activities = useActivities();
  const [dialogOpen, setDialogOpen] = useState(false);

  const historyByRecommendation = useMemo(
    () => selectRecommendationHistory(activities, zone.zone_id),
    [activities, zone.zone_id]
  );

  const zoneActivityCount = useMemo(
    () => selectZoneActivities(activities, zone.zone_id).length,
    [activities, zone.zone_id]
  );

  const actionedCount = zone.recommendations.filter(
    (r) => (historyByRecommendation.get(r)?.length ?? 0) > 0
  ).length;

  return (
    <div className="mt-5 pt-4 border-t border-line">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-accent flex items-center gap-2">
          <span className="w-2 h-2 bg-accent rounded-sm inline-block" aria-hidden="true" />
          Recommended actions
        </h4>
        <span className="font-mono text-[10.5px] text-faint shrink-0">
          {actionedCount} of {zone.recommendations.length} actioned
        </span>
      </div>

      <p className="text-[11px] text-muted leading-relaxed mb-3">
        Rule-based, derived from this zone&apos;s top contributing factors. Expand one to review
        its field context and record what was implemented.
      </p>

      {/* Outer card — clicking anywhere opens the dialog */}
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="w-full text-left mt-2 flex flex-col rounded-lg border border-accent/40 bg-accent/[0.04] hover:bg-accent/[0.08] hover:border-accent/70 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent overflow-hidden cursor-pointer"
      >
        {/* Recommendation rows — each in their own card inside */}
        <div className="flex flex-col gap-2 p-2">
          {zone.recommendations.map((recommendation, index) => {
            const { title, category } = classifyRecommendation(recommendation);
            const entries = historyByRecommendation.get(recommendation) ?? [];

            return (
              <div
                key={recommendation}
                className="flex items-start gap-2.5 rounded-md border border-accent/20 bg-bg-panel px-3 py-2.5"
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold ${
                    entries.length > 0 ? "bg-accent text-white" : "bg-accent/15 text-accent"
                  }`}
                >
                  {entries.length > 0 ? <CheckCircleIcon className="w-3 h-3" /> : index + 1}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-sm font-mono text-[9.5px] uppercase tracking-wide ${ACTION_CATEGORY_PILL_CLASS[category]}`}
                    >
                      {category}
                    </span>
                    {entries.length > 0 && (
                      <span className="inline-block px-1.5 py-0.5 rounded-sm font-mono text-[9.5px] bg-accent/15 text-accent">
                        {entries.length} logged
                      </span>
                    )}
                  </span>
                  <span className="block text-[12.5px] font-semibold text-ink leading-snug">
                    {title}
                  </span>
                  <span className="block font-mono text-[10px] text-muted mt-0.5 truncate">
                    Driver: <span className="text-accent">{describeDriver(recommendation, zone)}</span>
                  </span>
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer — label + arrow inline, right-aligned */}
        <div className="flex items-center justify-end gap-1.5 px-3 py-2">
          <span className="text-[12px] font-semibold text-accent">
            Validate Recommended Actions
          </span>
          <span className="text-accent font-semibold text-[13px]">→</span>
        </div>
      </button>

      {/* Rehabilitation timeline link */}
      <Link
        href={`/rehabilitation-activities/${encodeURIComponent(zone.zone_id)}`}
        className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-line hover:border-accent/50 bg-bg-panel-alt/40 hover:bg-bg-panel-alt px-3 py-2.5 transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span className="text-[12px] text-ink">
          View this zone&apos;s rehabilitation timeline
          <span className="block text-[10.5px] font-mono text-faint mt-0.5">
            {zoneActivityCount === 0
              ? "No actions logged for this zone yet"
              : `${zoneActivityCount} action${zoneActivityCount === 1 ? "" : "s"} on record`}
          </span>
        </span>
        <span className="text-accent shrink-0 transition-transform group-hover:translate-x-0.5">
          <ChevronRightIcon />
        </span>
      </Link>

      {/* Dialog — opens on top of the map panel */}
      <RecommendationsDialog
        zone={zone}
        open={dialogOpen}
        initialIndex={0}
        onClose={() => setDialogOpen(false)}
      />
    </div>
  );
}
