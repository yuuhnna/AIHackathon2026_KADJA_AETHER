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

/**
 * Compact summary of a zone's recommendations inside the map detail panel.
 * The panel is too narrow for the full logging form, so each row opens
 * RecommendationsDialog at that recommendation instead.
 */
export default function RecommendedActions({ zone }: { zone: ZoneSummary }) {
  const activities = useActivities();
  const [dialogIndex, setDialogIndex] = useState<number | null>(null);

  const historyByRecommendation = useMemo(
    () => selectRecommendationHistory(activities, zone.zone_id),
    [activities, zone.zone_id]
  );

  // Every activity on this zone, not just ones traceable to a recommendation
  // — the timeline shows seed records too, so the count must match it.
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

      <ul className="list-none flex flex-col gap-2">
        {zone.recommendations.map((recommendation, index) => {
          const { title, category } = classifyRecommendation(recommendation);
          const entries = historyByRecommendation.get(recommendation) ?? [];
          const latest = entries[0];

          return (
            <li key={recommendation}>
              <button
                type="button"
                onClick={() => setDialogIndex(index)}
                aria-haspopup="dialog"
                className={`w-full text-left rounded-lg border p-3 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  latest
                    ? "border-accent/40 bg-accent/[0.04] hover:bg-accent/[0.08]"
                    : "border-line bg-bg-panel-alt/40 hover:bg-bg-panel-alt hover:border-accent/50"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-mono text-[10px] font-semibold ${
                      latest ? "bg-accent text-white" : "bg-accent/15 text-accent"
                    }`}
                  >
                    {latest ? <CheckCircleIcon className="w-3 h-3" /> : index + 1}
                  </span>

                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 flex-wrap mb-1">
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
                    <span className="block font-mono text-[10px] text-muted mt-1 truncate">
                      Driver: <span className="text-accent">{describeDriver(recommendation, zone)}</span>
                    </span>
                  </span>

                  <span className="shrink-0 mt-1 text-accent">
                    <ChevronRightIcon />
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

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

      <RecommendationsDialog
        zone={zone}
        open={dialogIndex !== null}
        initialIndex={dialogIndex ?? 0}
        onClose={() => setDialogIndex(null)}
      />
    </div>
  );
}
