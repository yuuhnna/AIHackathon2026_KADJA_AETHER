// The four headline figures across the top of the Dashboard.

import type { SummaryStats } from "@/lib/types";
import { GridIcon, WarningIcon, LeafIcon, MapPinIcon } from "@/components/icons";

export default function KpiRow({ summary }: { summary: SummaryStats }) {
  const totalArea = summary.total_area_ha ?? summary.total_zones * 9.0;
  const maxLossAreaPercent = summary.max_area_loss_percent ?? 0;
  const activeRehabCount = summary.active_rehabilitation_count ?? 0;

  const kpis = [
    {
      label: "Total Mangrove Monitored",
      value: summary.total_zones.toLocaleString(),
      colorClass: "text-ink",
      accentClass: "bg-faint",
      icon: <GridIcon className="text-faint" />,
    },
    {
      label: "Total Mangrove Area (hectares)",
      value: `${Math.round(totalArea).toLocaleString()} ha`,
      colorClass: "text-accent",
      accentClass: "bg-accent",
      icon: <MapPinIcon className="text-accent" />,
    },
    {
      label: "Highest Predicted Area Loss (%)",
      value: `${maxLossAreaPercent.toFixed(2)}%`,
      colorClass: "text-risk-high",
      accentClass: "bg-risk-high",
      icon: <WarningIcon className="text-risk-high" />,
    },
    {
      label: "Active Rehabilitation Initiatives",
      value: activeRehabCount.toLocaleString(),
      colorClass: "text-risk-low",
      accentClass: "bg-risk-low",
      icon: <LeafIcon className="text-risk-low" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-3 pl-1.5">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="relative">
          <span
            className={`absolute -left-1.5 inset-y-0 right-0 rounded-2xl -z-10 ${kpi.accentClass}`}
            aria-hidden="true"
          />
          <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.3),0_1px_2px_rgba(0,0,0,0.2)] p-4 pl-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10.5px] uppercase tracking-wider text-muted font-medium">
                {kpi.label}
              </div>
              {kpi.icon}
            </div>
            <div className={`font-display text-[26px] xl:text-[28px] font-semibold ${kpi.colorClass}`}>
              {kpi.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}