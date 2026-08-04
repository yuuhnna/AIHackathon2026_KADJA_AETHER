"use client";

// Dashboard — KPI row, zone map with its slide-out assessment drawer,
// and the zone summary table. Owns the selected-zone state that the map
// and the table share.

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import KpiRow from "@/components/KpiRow";
import ZoneTable from "@/components/ZoneTable";
import DetailPanel from "@/components/DetailPanel";
import { MapPinIcon, CloseIcon } from "@/components/icons";
import { fetchZones, fetchSummary, fetchZoneDetail } from "@/lib/api";
import { useActivities } from "@/lib/activityStore";
import type { SummaryStats, ZoneSummary } from "@/lib/types";

const RealMap = dynamic(() => import("@/components/RealMap"), { ssr: false });

const LEGEND_ITEMS = [
  { label: "Top 10%", colorClass: "bg-risk-high" },
  { label: "Next 20%", colorClass: "bg-risk-moderate" },
  { label: "Remaining 70%", colorClass: "bg-risk-low" },
] as const;

export default function Home() {
  const [zones, setZones] = useState<ZoneSummary[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [filteredZones, setFilteredZones] = useState<ZoneSummary[]>([]);

  // Fetch real zones and summary stats from the backend once on mount.
  useEffect(() => {
    let cancelled = false;

    Promise.all([fetchZones(), fetchSummary()])
      .then(([zonesData, summaryData]) => {
        if (cancelled) return;
        setZones(zonesData);
        setFilteredZones(zonesData);
        setSummary(summaryData);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedZone =
    zones.find((z) => z.zone_id === selectedZoneId) ?? null;

  // Keeps the panel's content populated during the slide-out animation —
  // without this, the content would disappear instantly (selectedZone
  // becomes null) while the panel is still visually sliding away.
  const [displayedZone, setDisplayedZone] = useState<ZoneSummary | null>(null);
  useEffect(() => {
    if (selectedZone) setDisplayedZone(selectedZone);
  }, [selectedZone]);

  // The bulk zones list has empty top_factors/recommendations — fetch
  // the real, richer per-zone detail (SHAP-based factors + rule-based
  // recommendations) whenever a new zone is selected. detailZone starts
  // as the bulk-list version (so the panel shows something immediately)
  // and gets replaced once the real detail arrives.
  const [detailZone, setDetailZone] = useState<ZoneSummary | null>(null);
  useEffect(() => {
    if (!selectedZone) return;

    let cancelled = false;
    setDetailZone(selectedZone);

    fetchZoneDetail(selectedZone.zone_id)
      .then((detail) => {
        if (cancelled) return;
        setDetailZone(detail);
      })
      .catch(() => {
        // Keep showing the bulk-list version (empty factors) rather
        // than breaking the panel if the detail fetch fails.
      });

    return () => {
      cancelled = true;
    };
  }, [selectedZone]);

  const isPanelOpen = selectedZone !== null;

  // Count all individual activity records with Active status from Supabase
  const activities = useActivities();
  const activeRehabCount = useMemo(() => {
    return activities.filter((a) => a.status === "Active").length;
  }, [activities]);

  // Override the backend's active_rehabilitation_count with the live
  // Supabase-backed count so the KPI card stays in sync.
  const liveSummary = useMemo<SummaryStats | null>(() => {
    if (!summary) return null;
    return { ...summary, active_rehabilitation_count: activeRehabCount };
  }, [summary, activeRehabCount]);

  return (
    <main className="flex flex-1 flex-col px-6 pt-2 pb-8 gap-5 max-w-[1800px] mx-auto w-full">
      {liveSummary && <KpiRow summary={liveSummary} />}

      {error && (
        <div className="rounded-lg border border-risk-high/30 bg-risk-high/5 px-4 py-3 text-[12.5px] text-risk-high">
          Couldn&apos;t load dashboard data from the server: {error}. Is the backend running at{" "}
          <code className="font-mono">http://localhost:8000</code>?
        </div>
      )}

      <section className="bg-bg-panel border border-line rounded-2xl overflow-hidden relative">
        <header className="flex justify-between items-center px-5 py-3.5 border-b border-line bg-bg-panel-alt">
          <h2 className="font-display text-sm font-semibold flex items-center gap-2">
            <MapPinIcon className="text-accent" />
            <span className="text-ink">Zone map</span>
          </h2>
          <span className="font-mono text-[10.5px] uppercase tracking-wide text-faint">
            {loading ? "Loading…" : `${zones.length} zones plotted`}
          </span>
        </header>

        <div className="p-2 relative">
          <div style={{ height: 480 }} className="relative">
            <RealMap
              zones={filteredZones}
              selectedZoneId={selectedZoneId}
              onSelect={setSelectedZoneId}
            />

            <div
              className={`aether-panel-scroll absolute top-0 right-0 h-full w-[560px] max-w-[92%] backdrop-blur-sm border-l border-line shadow-[-8px_0_24px_-8px_rgba(22,36,30,0.2)] overflow-y-auto z-[500] rounded-r-xl transition-transform duration-300 ease-in-out ${
                isPanelOpen ? "translate-x-0" : "translate-x-full pointer-events-none"
              }`}
            >
              <div className="flex items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-widest text-accent font-semibold mb-1">
                    Zone Assessment Details
                  </div>
                  <h2 className="font-display text-[22px] font-bold text-ink leading-tight truncate">
                    {displayedZone?.zone_id}
                  </h2>
                  <p className="font-mono text-[11px] text-faint mt-1.5 tracking-wide">
                    Coordinates: {displayedZone?.lat.toFixed(4)}, {displayedZone?.lon.toFixed(4)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedZoneId(null)}
                  aria-label="Close zone detail panel"
                  className="shrink-0 w-8 h-8 rounded-full border border-line hover:border-risk-high/40 hover:bg-risk-high/10 flex items-center justify-center text-muted hover:text-risk-high transition-colors"
                >
                  <CloseIcon className="w-3 h-3" />
                </button>
              </div>
              <div className="border-t border-line mx-5" />
              <div className="p-5 pb-10">
                <DetailPanel zone={detailZone} />
              </div>
            </div>

            {isPanelOpen && (
              <div
                className="absolute bottom-0 right-0 w-[560px] max-w-[92%] h-10 pointer-events-none z-[501] rounded-br-xl"
                style={{
                  background: "linear-gradient(to top, rgba(243,248,245,0.55), rgba(243,248,245,0))",
                }}
              />
            )}
          </div>

          <div className="mt-3 px-3 py-2.5">
            <div className="mb-2">
              <span className="font-display text-[12px] font-semibold text-ink">
                AETHER Priority Ranking
              </span>
              <span className="font-mono text-[10.5px] text-faint ml-2">
                by predicted mangrove area loss, ranked within each municipality
              </span>
            </div>
            <div className="flex items-center gap-5 flex-wrap font-mono text-[11px] text-muted">
              {LEGEND_ITEMS.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${item.colorClass}`} />
                  {item.label}
                </span>
              ))}
              {/* Colour on the map is the tier above; shading depth is
                  how many zones of that tier sit together. */}
              <span className="inline-flex items-center gap-1.5 ml-auto">
                <span
                  className="inline-block w-[52px] h-[10px] rounded-full border border-line"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(22,36,30,0.10), rgba(22,36,30,0.70))",
                  }}
                />
                <span className="text-faint">
                  shading = zone density; zoom in for actual zone footprints
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-bg-panel border border-line rounded-2xl p-5">
        <h2 className="font-mono text-[11px] uppercase tracking-wider text-faint font-medium mb-4">
          Zone Summary
        </h2>
        <ZoneTable
          zones={zones}
          selectedZoneId={selectedZoneId}
          onSelect={setSelectedZoneId}
          onFilteredZonesChange={setFilteredZones}
        />
      </section>
    </main>
  );
}