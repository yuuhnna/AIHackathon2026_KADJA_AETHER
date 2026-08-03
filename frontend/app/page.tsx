"use client";

import { useState } from "react";
import NavBar from "@/components/NavBar";
import KpiRow from "@/components/KpiRow";
import ZoneMap from "@/components/ZoneMap";
import type { SummaryStats, ZoneSummary } from "@/lib/types";

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
    <div className="flex min-h-screen flex-col bg-[#0B1410]">
      <NavBar />
      <main className="flex flex-1 flex-col px-6 py-6">
        <KpiRow summary={placeholderSummary} />
        <div className="bg-bg-panel border border-line rounded-2xl p-5">
          <ZoneMap
            zones={placeholderZones}
            selectedZoneId={selectedZoneId}
            onSelect={setSelectedZoneId}
          />
        </div>
      </main>
    </div>
  );
}