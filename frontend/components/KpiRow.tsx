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
      unit: "zones",
      colorClass: "text-ink",
      badgeBg: "bg-faint/15",
      icon: <GridIcon className="text-faint" />,
    },
    {
      label: "Total Mangrove Area",
      value: Math.round(totalArea).toLocaleString(),
      unit: "ha",
      colorClass: "text-accent",
      badgeBg: "bg-accent/15",
      icon: <MapPinIcon className="text-accent" />,
    },
    {
      label: "Highest Predicted Area Loss",
      value: maxLossAreaPercent.toFixed(2),
      unit: "%",
      colorClass: "text-risk-high",
      badgeBg: "bg-risk-high/15",
      icon: <WarningIcon className="text-risk-high" />,
    },
    {
      label: "Active Rehabilitation Initiatives",
      value: activeRehabCount.toLocaleString(),
      unit: "active",
      colorClass: "text-risk-low",
      badgeBg: "bg-risk-low/15",
      icon: <LeafIcon className="text-risk-low" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="group bg-bg-panel border border-line rounded-2xl p-5 transition-all duration-200 hover:border-line hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.4)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10.5px] uppercase tracking-widest text-muted font-medium leading-tight max-w-[70%]">
              {kpi.label}
            </div>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${kpi.badgeBg}`}>
              {kpi.icon}
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className={`font-display text-[30px] xl:text-[32px] font-semibold tracking-tight ${kpi.colorClass}`}>
              {kpi.value}
            </span>
            <span className="text-xs font-medium text-faint">{kpi.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}