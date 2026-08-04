"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { ZoneSummary } from "@/lib/types";
import { selectRecommendationHistory, useActivities } from "@/lib/activityStore";
import RecommendationCard from "@/components/RecommendationCard";
import { ChevronRightIcon, CloseIcon } from "@/components/icons";

/**
 * Expanded view of a zone's recommendations, opened from the Recommended
 * Actions panel.
 *
 * Rendered as a native <dialog> with showModal(): that puts it in the
 * browser's top layer, so it escapes the map's stacking context without a
 * z-index fight, and gives focus trapping plus Escape-to-close for free.
 */
export default function RecommendationsDialog({
  zone,
  open,
  initialIndex = 0,
  onClose,
}: {
  zone: ZoneSummary;
  open: boolean;
  /** Which recommendation to expand on open — the one the user clicked. */
  initialIndex?: number;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const activities = useActivities();
  const historyByRecommendation = useMemo(
    () => selectRecommendationHistory(activities, zone.zone_id),
    [activities, zone.zone_id]
  );

  // Accordion: one open at a time, starting with whichever the user clicked.
  const [openIndex, setOpenIndex] = useState(initialIndex);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      setOpenIndex(initialIndex);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialIndex]);

  if (!open) return null;

  const totalLogged = Array.from(historyByRecommendation.values()).reduce(
    (sum, entries) => sum + entries.length,
    0
  );

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onKeyDown={(e) => {
        // The Dashboard closes the zone panel on Escape. Without this, one
        // press would dismiss both the dialog and the panel behind it.
        if (e.key === "Escape") e.stopPropagation();
      }}
      onClick={(e) => {
        // Backdrop clicks land on the dialog element itself.
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby="recommendations-dialog-title"
      className="m-auto w-[min(760px,calc(100vw-2rem))] max-h-[min(88vh,900px)] rounded-2xl border border-line bg-bg-panel p-0 text-ink shadow-[0_24px_64px_-16px_rgba(22,36,30,0.35)] backdrop:bg-ink/40 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex flex-col max-h-[inherit]">
        <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-line bg-bg-panel-alt/60 shrink-0">
          <div className="min-w-0">
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-faint mb-1">
              Recommendation engine · {zone.zone_id}
            </div>
            <h2
              id="recommendations-dialog-title"
              className="font-display text-lg font-bold text-ink leading-tight"
            >
              Expert-derived recommendations
            </h2>
            <p className="text-[11.5px] text-muted mt-1 leading-relaxed">
              Rule-based, not model-generated. Expand one to review its field context and record
              what was implemented.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close recommendations"
            className="shrink-0 flex items-center justify-center w-7 h-7 rounded-md border border-line text-muted hover:text-ink hover:bg-bg-panel transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-4 flex-1">
          <ul className="list-none flex flex-col gap-2.5">
            {zone.recommendations.map((recommendation, index) => (
              <RecommendationCard
                key={recommendation}
                zone={zone}
                recommendation={recommendation}
                index={index}
                history={historyByRecommendation.get(recommendation) ?? []}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex((current) => (current === index ? -1 : index))}
              />
            ))}
          </ul>
        </div>

        <footer className="px-6 py-3.5 border-t border-line bg-bg-panel-alt/60 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <span className="font-mono text-[11px] text-faint">
            {totalLogged === 0
              ? "No entries recorded against these recommendations yet"
              : `${totalLogged} entr${totalLogged === 1 ? "y" : "ies"} recorded`}
          </span>
          <Link
            href={`/rehabilitation-activities/${encodeURIComponent(zone.zone_id)}`}
            className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-accent hover:text-white bg-accent/10 hover:bg-accent border border-accent/30 hover:border-accent px-3 py-1.5 rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Open in Rehabilitation Activities
            <ChevronRightIcon />
          </Link>
        </footer>
      </div>
    </dialog>
  );
}
