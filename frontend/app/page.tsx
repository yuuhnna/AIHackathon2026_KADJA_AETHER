"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import KpiRow from "@/components/KpiRow";
import { MapPinIcon } from "@/components/icons";
import { MOCK_ZONES } from "@/lib/mockZones";
import type { SummaryStats } from "@/lib/types";

const RealMap = dynamic(() => import("@/components/RealMap"), { ssr: false });

const placeholderSummary: SummaryStats = {
  total_zones: 128,
  total_area_ha: 1152,
  max_area_loss_percent: 4.7,
  active_rehabilitation_count: 12,
};

export default function Home() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  return (
    <main className="flex flex-1 flex-col px-6 py-6">
      <KpiRow summary={placeholderSummary} />
      <div className="bg-bg-panel border border-line rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
          <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
            <MapPinIcon />
            <span className="text-ink">Zone map</span>
          </h2>
          <span className="font-mono text-[11px] text-faint">{MOCK_ZONES.length} zones plotted</span>
        </div>
        <div className="p-2">
          <div style={{ height: 480 }}>
            <RealMap
              zones={MOCK_ZONES}
              selectedZoneId={selectedZoneId}
              onSelect={setSelectedZoneId}
            />
          </div>
          <div className="flex gap-4 mt-3 px-2 pb-1 flex-wrap font-mono text-[11px] text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-risk-low" />
              Low risk
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-risk-moderate" />
              Moderate risk
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full inline-block bg-risk-high" />
              High risk
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-risk-high text-white text-[10px] font-bold">
                N
              </span>
              Badge = high-risk zones in that cluster
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
