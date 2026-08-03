"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import KpiRow from "@/components/KpiRow";
import type { SummaryStats, ZoneSummary } from "@/lib/types";

const RealMap = dynamic(() => import("@/components/RealMap"), { ssr: false });

const placeholderSummary: SummaryStats = {
  total_zones: 128,
  total_area_ha: 1152,
  max_area_loss_percent: 4.7,
  active_rehabilitation_count: 12,
};

const placeholderZones: ZoneSummary[] = [
  { zone_id: "z1", lat: 10.72, lon: 122.56, vulnerability_score: 0.82, risk_class: "high" },
  { zone_id: "z2", lat: 10.75, lon: 122.60, vulnerability_score: 0.45, risk_class: "moderate" },
  { zone_id: "z3", lat: 10.68, lon: 122.54, vulnerability_score: 0.20, risk_class: "low" },
  { zone_id: "z4", lat: 10.70, lon: 122.65, vulnerability_score: 0.60, risk_class: "moderate" },
  { zone_id: "z5", lat: 10.77, lon: 122.50, vulnerability_score: 0.15, risk_class: "low" },
];

export default function Home() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  return (
    <main className="flex flex-1 flex-col px-6 py-6">
      <KpiRow summary={placeholderSummary} />
      <div className="bg-bg-panel border border-line rounded-2xl p-2">
        <div style={{ height: 480 }}>
          <RealMap
            zones={placeholderZones}
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
    </main>
  );
}
