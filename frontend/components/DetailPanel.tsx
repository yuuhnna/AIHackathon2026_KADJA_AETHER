import type { ZoneSummary } from "@/lib/types";
import { RISK_PILL_CLASS } from "@/lib/colors";

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <path
        d="M10 2.5l8.5 14.7a1 1 0 01-.87 1.5H2.37a1 1 0 01-.87-1.5L10 2.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M10 8v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.8" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ArrowIcon({ direction }: { direction: "increases" | "decreases" }) {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d={direction === "increases" ? "M10 16V4M10 4l-5 5M10 4l5 5" : "M10 4v12M10 16l-5-5M10 16l5-5"}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DetailPanel({
  zone,
  onActionsClick,
}: {
  zone: ZoneSummary | null;
  onActionsClick?: (recommendations: string[]) => void;
}) {
  if (!zone) {
    return (
      <div className="text-faint text-[12.5px] leading-relaxed py-3">
        No zone selected. Click a marker on the map or a row in the table to see its
        predicted vulnerability, contributing factors, and recommended actions.
      </div>
    );
  }

  const textColorClass =
    zone.risk_class === "high"
      ? "text-risk-high"
      : zone.risk_class === "moderate"
      ? "text-risk-moderate"
      : "text-risk-low";

  // Most influential to least, ranked by magnitude of impact.
  const sortedFactors = [...zone.top_factors].sort(
    (a, b) => Math.abs(b.value) - Math.abs(a.value)
  );
  const maxAbsImpact = Math.max(...sortedFactors.map((f) => Math.abs(f.value)), 0.0001);

  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-wider text-muted mb-1.5">
        Predicted mangrove area loss (%)
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className={`font-display text-[36px] font-bold leading-none ${textColorClass}`}>
          {zone.expected_area_loss.toFixed(2)}%
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-md font-mono text-[11px] font-semibold tracking-wide ${RISK_PILL_CLASS[zone.risk_class]}`}
        >
          {zone.risk_class.toUpperCase()} RISK
        </span>
      </div>

      <div className="text-[10.5px] uppercase tracking-wider text-muted mt-1 mb-1.5">
        Contributing factors
      </div>
      <div>
        {sortedFactors.map((f) => {
          const direction: "increases" | "decreases" = f.value >= 0 ? "increases" : "decreases";
          const barWidthPct = (Math.abs(f.value) / maxAbsImpact) * 100;
          const barColorClass = direction === "increases" ? "bg-risk-high" : "bg-risk-low";
          const iconColorClass = direction === "increases" ? "text-risk-high" : "text-risk-low";

          return (
            <div
              key={f.label}
              className="flex items-center gap-2.5 py-1.5 border-b border-line-soft last:border-none"
            >
              <span className="text-[12.5px] text-ink w-[42%] shrink-0" title={f.label}>
                {f.label}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-bg-panel-alt overflow-hidden">
                <div className={`h-full rounded-full ${barColorClass}`} style={{ width: `${barWidthPct}%` }} />
              </div>
              <span className="font-mono text-[10.5px] text-muted w-14 text-right shrink-0">
                {f.value > 0 ? "+" : ""}
                {f.value.toFixed(3)}
              </span>
              <span className={`shrink-0 ${iconColorClass}`}>
                <ArrowIcon direction={direction} />
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-line">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-accent mb-2 flex items-center gap-2">
          <span className="w-2 h-2 bg-accent rounded-sm inline-block" />
          Recommended actions
        </div>

        <button
          type="button"
          onClick={() => onActionsClick?.(zone.recommendations)}
          className="w-full text-left rounded-lg border border-line hover:border-accent/50 bg-bg-panel-alt/40 hover:bg-bg-panel-alt transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <ul className="list-none">
            {zone.recommendations.map((rec, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 py-2.5 px-3 border-b border-line-soft last:border-none hover:bg-accent/5 transition-colors"
              >
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center font-mono text-[10px] font-semibold">
                  {i + 1}
                </span>
                <span className="flex-1 text-[12.5px] text-ink leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </button>
      </div>

      {zone.confidence_flag !== "ok" && (
        <div role="status" className="mt-4 flex items-start gap-1.5 text-[11px] text-muted pl-0.5">
          <AlertIcon className="mt-0.5 shrink-0 text-risk-moderate" />
          <span>
            <span className="font-mono text-risk-moderate font-medium">Low confidence</span>
            {" — "}
            this assessment relies on limited or placeholder data. Treat it as indicative
            pending field validation.
          </span>
        </div>
      )}
    </div>
  );
}