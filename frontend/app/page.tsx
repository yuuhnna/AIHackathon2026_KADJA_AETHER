"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import KpiRow from "@/components/KpiRow";
import ZoneTable from "@/components/ZoneTable";
import DetailPanel from "@/components/DetailPanel";
import { MapPinIcon } from "@/components/icons";
import { MOCK_ZONES } from "@/lib/mockZones";
import type { SummaryStats, ZoneSummary } from "@/lib/types";

const RealMap = dynamic(() => import("@/components/RealMap"), { ssr: false });

const placeholderSummary: SummaryStats = {
  total_zones: 128,
  total_area_ha: 1152,
  max_area_loss_percent: 4.7,
  active_rehabilitation_count: 12,
};

export default function Home() {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [filteredZones, setFilteredZones] = useState<ZoneSummary[]>(MOCK_ZONES);

  const selectedZone =
    MOCK_ZONES.find((z) => z.zone_id === selectedZoneId) ?? null;

  // Keeps the panel's content populated during the slide-out animation —
  // without this, the content would disappear instantly (selectedZone
  // becomes null) while the panel is still visually sliding away.
  const [displayedZone, setDisplayedZone] = useState<ZoneSummary | null>(null);
  useEffect(() => {
    if (selectedZone) setDisplayedZone(selectedZone);
  }, [selectedZone]);

  const isPanelOpen = selectedZone !== null;

  return (
    <main className="flex flex-1 flex-col px-6 py-6 gap-6">
      <KpiRow summary={placeholderSummary} />

      <div className="bg-bg-panel border border-line rounded-2xl overflow-hidden relative">
        <div className="flex justify-between items-center px-4.5 py-3.5 border-b border-line bg-bg-panel-alt">
          <h2 className="font-display text-sm font-semibold flex items-center gap-2 text-accent">
            <MapPinIcon />
            <span className="text-ink">Zone map</span>
          </h2>
          <span className="font-mono text-[11px] text-faint">{MOCK_ZONES.length} zones plotted</span>
        </div>
        <div className="p-2 relative">
          <div style={{ height: 480 }} className="relative">
            <RealMap
              zones={filteredZones}
              selectedZoneId={selectedZoneId}
              onSelect={setSelectedZoneId}
            />

            <div
              className={`absolute top-0 right-0 h-full w-[560px] max-w-[92%] backdrop-blur-2xl border-l border-line shadow-[-8px_0_24px_-8px_rgba(22,36,30,0.2)] overflow-y-auto z-[500] rounded-r-xl transition-transform duration-300 ease-in-out ${
                isPanelOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
              }`}
            >
              <div className="flex items-start justify-between gap-2 px-4.5 py-3.5 border-b border-line backdrop-blur-2xl sticky top-0">
                <div>
                  <h2 className="font-display text-sm font-semibold text-ink leading-tight">
                    Zone Assessment Details — {displayedZone?.zone_id}
                  </h2>
                  <p className="font-mono text-[10.5px] text-faint mt-1">
                    Coordinates: {displayedZone?.lat.toFixed(4)}, {displayedZone?.lon.toFixed(4)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedZoneId(null)}
                  aria-label="Close zone detail panel"
                  className="shrink-0 w-7 h-7 rounded-md border border-line hover:bg-bg-panel-alt flex items-center justify-center text-muted hover:text-ink transition-colors"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <DetailPanel zone={displayedZone} />
              </div>
            </div>
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

      <div className="bg-bg-panel border border-line rounded-2xl p-4">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-faint font-medium mb-3">
          Zone Summary
        </h2>
        <ZoneTable
          zones={MOCK_ZONES}
          selectedZoneId={selectedZoneId}
          onSelect={setSelectedZoneId}
          onFilteredZonesChange={setFilteredZones}
        />
      </div>
    </main>
  );
}