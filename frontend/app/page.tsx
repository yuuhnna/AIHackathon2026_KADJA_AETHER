"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import KpiRow from "@/components/KpiRow";
import ZoneTable from "@/components/ZoneTable";
import type { SummaryStats, ZoneSummary } from "@/lib/types";

const RealMap = dynamic(() => import("@/components/RealMap"), { ssr: false });

const placeholderSummary: SummaryStats = {
  total_zones: 128,
  total_area_ha: 1152,
  max_area_loss_percent: 4.7,
  active_rehabilitation_count: 12,
};

const placeholderZones: ZoneSummary[] = [
  {
    zone_id: "z1",
    lat: 10.72,
    lon: 122.56,
    vulnerability_score: 4.70,
    risk_class: "high",
    confidence_flag: "ok",
    municipality: "Iloilo City",
    expected_area_loss: 2.3,
    rehabilitation_status: "Active",
    top_factors: [{ label: "NDVI decline", value: 0.42 }, { label: "High temp", value: 0.31 }],
  },
  {
    zone_id: "z2",
    lat: 10.75,
    lon: 122.60,
    vulnerability_score: 3.21,
    risk_class: "moderate",
    confidence_flag: "ok",
    municipality: "Leganes",
    expected_area_loss: 1.5,
    rehabilitation_status: "Planned",
    top_factors: [{ label: "Aquaculture proximity", value: 0.38 }],
  },
  {
    zone_id: "z3",
    lat: 10.68,
    lon: 122.54,
    vulnerability_score: 1.10,
    risk_class: "low",
    confidence_flag: "low",
    municipality: "Pavia",
    expected_area_loss: 0.4,
    rehabilitation_status: "None",
    top_factors: [{ label: "Slope", value: 0.22 }],
  },
  {
    zone_id: "z4",
    lat: 10.70,
    lon: 122.65,
    vulnerability_score: 2.85,
    risk_class: "moderate",
    confidence_flag: "ok",
    municipality: "Oton",
    expected_area_loss: 1.1,
    rehabilitation_status: "Under Review",
    top_factors: [{ label: "River proximity", value: 0.29 }],
  },
  {
    zone_id: "z5",
    lat: 10.77,
    lon: 122.50,
    vulnerability_score: 0.95,
    risk_class: "low",
    confidence_flag: "ok",
    municipality: "Leganes",
    expected_area_loss: 0.2,
    rehabilitation_status: "Completed",
    top_factors: [{ label: "Wind speed", value: 0.18 }],
  },
];

export default function Home() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [filteredZones, setFilteredZones] = useState<ZoneSummary[]>(placeholderZones);

  return (
    <main className="flex flex-1 flex-col px-6 py-6 gap-6">
      <KpiRow summary={placeholderSummary} />

      <div className="bg-bg-panel border border-line rounded-2xl p-2">
        <div style={{ height: 480 }}>
          <RealMap
            zones={filteredZones}
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

      <div className="bg-bg-panel border border-line rounded-2xl p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-faint font-medium mb-3">
          Zone Summary
        </h2>
        <ZoneTable
          zones={placeholderZones}
          selectedZoneId={selectedZoneId}
          onSelect={setSelectedZoneId}
          onFilteredZonesChange={setFilteredZones}
        />
      </div>
    </main>
  );
}
