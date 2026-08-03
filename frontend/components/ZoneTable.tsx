"use client";

import { useEffect, useMemo, useState } from "react";
import type { ZoneSummary } from "@/lib/types";
import { downloadCSV } from "@/lib/csv";
import { REHAB_STATUS_PILL_CLASS, RISK_PILL_CLASS } from "@/lib/colors";
import {
  selectEffectiveStatus,
  selectLatestStatusByZone,
  useActivities,
} from "@/lib/activityStore";

const ILOILO_LGUS = [
  "Ajuy", "Alimodian", "Anilao", "Badiangan", "Balasan", "Banate",
  "Barotac Nuevo", "Barotac Viejo", "Batad", "Bingawan", "Cabatuan",
  "Calinog", "Carles", "Concepcion", "Dingle", "Dueñas", "Dumangas",
  "Estancia", "Guimbal", "Igbaras", "Janiuay", "Lambunao", "Leganes",
  "Lemery", "Leon", "Maasin", "Miagao", "Mina", "New Lucena",
  "Oton", "Pavia", "Pototan", "San Dionisio", "San Enrique",
  "San Joaquin", "San Miguel", "San Rafael", "Santa Barbara",
  "Sara", "Tigbauan", "Tubungan", "Zarraga", "Iloilo City", "Passi City",
];

function CheckIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10.5l4 4 8-9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden="true">
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

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden="true" className="shrink-0">
      <path d="M5 7.5l5 5 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 3v10m0 0l-4-4m4 4l4-4M4 15v1.5A1.5 1.5 0 005.5 18h9a1.5 1.5 0 001.5-1.5V15"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" aria-hidden="true" className={className}>
      <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 9v4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="10" cy="6.5" r="0.9" fill="currentColor" />
    </svg>
  );
}

export default function ZoneTable({
  zones,
  selectedZoneId,
  onSelect,
  onFilteredZonesChange,
}: {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  onSelect: (zoneId: string) => void;
  // Fires whenever the filtered result changes, so a parent (e.g. the
  // Dashboard) can sync the map to show only what's currently visible
  // in the table — filtering here drives the map, not the other way
  // around.
  onFilteredZonesChange?: (zones: ZoneSummary[]) => void;
}) {
  // Memoised so the `?? []` fallback doesn't hand every downstream useMemo a
  // fresh array identity on each render.
  const safeZones = useMemo(() => zones ?? [], [zones]);

  // A zone's status as displayed here is the status of its most recent
  // logged rehabilitation activity, falling back to the feature table's
  // value. Without this, a zone would still read "None" immediately after
  // an officer logged work against it from Recommended Actions.
  const activities = useActivities();
  const latestStatusByZone = useMemo(
    () => selectLatestStatusByZone(activities),
    [activities]
  );
  const effectiveStatus = useMemo(() => {
    const byZone = new Map<string, string>();
    for (const zone of safeZones) {
      byZone.set(zone.zone_id, selectEffectiveStatus(latestStatusByZone, zone));
    }
    return byZone;
  }, [safeZones, latestStatusByZone]);

  const [riskFilter, setRiskFilter] = useState<"all" | "High" | "Moderate" | "Low">("all");
  const [municipalityFilter, setMunicipalityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showRiskInfo, setShowRiskInfo] = useState(false);

  const municipalityOptions = useMemo(() => {
    const set = new Set<string>();
    safeZones.forEach((z) => {
      if (z.municipality) set.add(z.municipality);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [safeZones]);

  // Derived from the effective statuses, so a status that exists only in the
  // activity log is still selectable in the filter.
  const statusOptions = useMemo(() => {
    const set = new Set<string>(effectiveStatus.values());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [effectiveStatus]);

  const filtered = useMemo(() => {
    let result = safeZones.filter((z) => {
      if (riskFilter !== "all" && z.risk_class.toLowerCase() !== riskFilter.toLowerCase()) return false;
      if (municipalityFilter !== "all" && z.municipality !== municipalityFilter) return false;
      if (statusFilter !== "all" && effectiveStatus.get(z.zone_id) !== statusFilter) return false;
      if (search && !z.zone_id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
    // Default sort: highest predicted vulnerability first — most
    // at-risk zones surface at the top without needing manual sorting.
    result = [...result].sort((a, b) => b.vulnerability_score - a.vulnerability_score);
    return result;
  }, [safeZones, riskFilter, municipalityFilter, statusFilter, search, effectiveStatus]);

  // Report the filtered list up to the parent every time it changes
  // (including on mount, so the map starts in sync with "no filters
  // applied" = everything shown).
  useEffect(() => {
    onFilteredZonesChange?.(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const activeFilterCount =
    (riskFilter !== "all" ? 1 : 0) +
    (municipalityFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (search !== "" ? 1 : 0);

  function clearFilters() {
    setRiskFilter("all");
    setMunicipalityFilter("all");
    setStatusFilter("all");
    setSearch("");
  }

  function handleExport() {
    const rows = filtered.map((z) => ({
      zone_id: z.zone_id,
      municipality: z.municipality ?? "",
      lat: z.lat,
      lon: z.lon,
      vulnerability_score: z.vulnerability_score,
      area_loss_pct: z.vulnerability_score.toFixed(2),
      risk_class: z.risk_class,
      confidence_flag: z.confidence_flag,
      rehabilitation_status: effectiveStatus.get(z.zone_id) ?? "None",
      
    }));

    const parts = ["aether-zones"];
    if (riskFilter !== "all") parts.push(riskFilter.toLowerCase());
    if (municipalityFilter !== "all") {
      parts.push(municipalityFilter.toLowerCase().replace(/\s+/g, "-"));
    }
    if (statusFilter !== "all") {
      parts.push(statusFilter.toLowerCase().replace(/\s+/g, "-"));
    }
    if (search.trim() !== "") {
      parts.push(`search-${search.trim().toLowerCase().replace(/\s+/g, "-")}`);
    }
    parts.push(new Date().toISOString().slice(0, 10));

    downloadCSV(`${parts.join("-")}.csv`, rows);
  }

  return (
    <div>
      {/* Filter toolbar */}
      <div className="rounded-lg border border-line-soft bg-bg-panel-alt/40 p-3.5 mb-3">
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          {/* Risk */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <label className="text-[10px] uppercase tracking-wider text-faint font-medium">
                Risk
              </label>
              <button
                type="button"
                onClick={() => setShowRiskInfo((v) => !v)}
                onBlur={() => setShowRiskInfo(false)}
                aria-label="How risk is calculated"
                aria-expanded={showRiskInfo}
                className="relative flex items-center justify-center w-4 h-4 rounded-full text-faint hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
              >
                <InfoIcon />
                {showRiskInfo && (
                  <span className="absolute left-0 top-5 z-20 w-72 rounded-md border border-line bg-bg-panel px-3 py-2.5 text-[11px] normal-case tracking-normal font-normal text-muted leading-relaxed shadow-lg text-left">
                    <span className="block font-semibold text-ink mb-1">How risk is calculated</span>
                    Risk is ranked within each municipality — the top 10% most
                    vulnerable zones locally are High risk. This is a
                    configurable proportional cutoff, not a fixed DENR
                    threshold; DENR does not apply a province-wide
                    vulnerability cutoff.
                  </span>
                )}
              </button>
            </div>
            <div className="flex gap-1">
              {(["all", "High", "Moderate", "Low"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRiskFilter(r)}
                  aria-pressed={riskFilter === r}
                  className={`cursor-pointer font-mono text-[11px] border px-2.5 py-[7px] rounded-sm tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 ${
                    riskFilter === r
                      ? "border-accent text-white bg-accent font-semibold"
                      : "border-line bg-bg-panel text-muted hover:text-ink hover:border-faint"
                  }`}
                >
                  {r === "all" ? "ALL" : r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Municipality */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-faint font-medium mb-1.5">
              Municipality / City
            </label>
            <div className="relative">
              <select
                aria-label="Filter by municipality or city"
                value={municipalityFilter}
                onChange={(e) => setMunicipalityFilter(e.target.value)}
                className={`appearance-none cursor-pointer border font-mono text-[11px] pl-3 pr-7 py-[7px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors min-w-[150px] ${
                  municipalityFilter !== "all"
                    ? "border-accent/50 bg-accent/10 text-accent font-semibold"
                    : "border-line bg-bg-panel text-ink focus:border-accent"
                }`}
              >
                <option value="all">All</option>
                {municipalityOptions.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-faint">
                <ChevronDownIcon />
              </span>
            </div>
          </div>

          {/* Rehab status */}
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-faint font-medium mb-1.5">
              Rehab. Status
            </label>
            <div className="relative">
              <select
                aria-label="Filter by rehabilitation status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`appearance-none cursor-pointer border font-mono text-[11px] pl-3 pr-7 py-[7px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors min-w-[130px] ${
                  statusFilter !== "all"
                    ? "border-accent/50 bg-accent/10 text-accent font-semibold"
                    : "border-line bg-bg-panel text-ink focus:border-accent"
                }`}
              >
                <option value="all">All</option>
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-faint">
                <ChevronDownIcon />
              </span>
            </div>
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[10px] uppercase tracking-wider text-faint font-medium mb-1.5">
              Search
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint">
                <SearchIcon />
              </span>
              <input
                type="text"
                aria-label="Search by zone ID"
                placeholder="Zone ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-bg-panel border border-line text-ink font-mono text-[11px] pl-8 pr-2.5 py-[7px] rounded-sm placeholder:text-faint outline-none focus-visible:ring-2 focus-visible:ring-accent focus:border-accent transition-colors"
              />
            </div>
          </div>

          {/* Clear */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer flex items-center gap-1.5 font-mono text-[11px] text-accent hover:text-white bg-accent/10 hover:bg-accent border border-accent/30 hover:border-accent px-2.5 py-[7px] rounded-sm transition-colors shrink-0"
            >
              <CloseIcon />
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[11px] text-faint">
          Showing <span className="text-muted font-medium">{filtered.length.toLocaleString()}</span> of{" "}
          {safeZones.length.toLocaleString()} zones
        </span>
        <button
          type="button"
          onClick={handleExport}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 font-mono text-[11px] text-muted hover:text-ink border border-line hover:border-faint bg-bg-panel px-2.5 py-1.5 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <DownloadIcon />
          Export CSV
        </button>
      </div>

      <div className="max-h-[420px] overflow-y-auto overflow-x-auto rounded-lg border border-line-soft">
        <table className="w-full border-collapse text-[12.5px] table-fixed min-w-[920px]">
          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[13%]" />
            <col className="w-[13%]" />
            <col className="w-[9%]" />
            <col className="w-[22%]" />
            <col className="w-[10%]" />
            <col className="w-[13%]" />
          </colgroup>
          <thead className="bg-bg-panel-alt sticky top-0 z-10">
            <tr>
              <th className="text-left text-[10.5px] uppercase tracking-wider text-faint px-3 py-2.5 border-b border-line">
                Zone
              </th>
              <th className="text-left text-[10.5px] uppercase tracking-wider text-faint px-3 py-2.5 border-b border-line">
                Municipality / City
              </th>
              <th className="text-center text-[10.5px] uppercase tracking-wider text-faint px-3 py-2.5 border-b border-line">
                Area Loss (%)
              </th>
              <th className="text-center text-[10.5px] uppercase tracking-wider text-faint px-3 py-2.5 border-b border-line">
                Risk
              </th>
              <th className="text-left text-[10.5px] uppercase tracking-wider text-faint px-3 py-2.5 border-b border-line">
                Top Contributing Factor
              </th>
              <th className="text-center text-[10.5px] uppercase tracking-wider text-faint px-3 py-2.5 border-b border-line">
                Confidence
              </th>
              <th className="text-center text-[10.5px] uppercase tracking-wider text-faint px-3 py-2.5 border-b border-line">
                Rehab. Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((z) => (
              <tr
                key={z.zone_id}
                tabIndex={0}
                role="button"
                aria-pressed={z.zone_id === selectedZoneId}
                aria-label={`View details for zone ${z.zone_id}`}
                onClick={() => onSelect(z.zone_id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect(z.zone_id);
                  }
                }}
                className={`cursor-pointer hover:bg-bg-panel-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
                  z.zone_id === selectedZoneId ? "bg-bg-panel-alt shadow-[inset_2px_0_0_theme(colors.accent)]" : ""
                }`}
              >
                <td className="font-mono px-3 py-2.5 border-b border-line-soft truncate" title={z.zone_id}>
                  {z.zone_id}
                </td>
                <td className="px-3 py-2.5 border-b border-line-soft text-ink truncate" title={z.municipality}>
                  {z.municipality ?? "—"}
                </td>
                <td className="font-mono px-3 py-2.5 border-b border-line-soft text-center">
                  {z.vulnerability_score.toFixed(2)}%
                </td>
                <td className="px-2 py-2.5 border-b border-line-soft">
                  <div className="flex justify-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10.5px] ${RISK_PILL_CLASS[z.risk_class]}`}
                    >
                      {z.risk_class.toUpperCase()}
                    </span>
                  </div>
                </td>
                <td
                  className="font-mono px-3 py-2.5 border-b border-line-soft text-muted truncate"
                  title={z.top_factors[0]?.label ?? "—"}
                >
                  {z.top_factors[0]?.label ?? "—"}
                </td>
                <td className="px-2 py-2.5 border-b border-line-soft">
                  <div className="flex justify-center">
                    {z.confidence_flag === "ok" ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-risk-low">
                        <CheckIcon /> ok
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-risk-moderate">
                        <AlertIcon /> low
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 py-2.5 border-b border-line-soft">
                  <div className="flex justify-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] whitespace-nowrap ${
                        REHAB_STATUS_PILL_CLASS[effectiveStatus.get(z.zone_id) ?? "None"] ??
                        REHAB_STATUS_PILL_CLASS.None
                      }`}
                    >
                      {effectiveStatus.get(z.zone_id) ?? "None"}
                    </span>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-faint font-mono text-[12px]">
                  No zones match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
