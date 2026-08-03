"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_ZONES } from "@/lib/mockZones";
import { REHAB_STATUS_PILL_CLASS, RISK_PILL_CLASS, RISK_SORT_ORDER } from "@/lib/colors";
import { selectAreaSummaries, useActivities, type RehabAreaSummary } from "@/lib/activityStore";
import { REHAB_STATUSES } from "@/lib/types";
import { formatIsoDate } from "@/lib/dates";
import { ArchiveIcon, InfoIcon, ChevronDownIcon, CloseIcon } from "@/components/icons";

type SortKey = "latest_date" | "activity_count" | "risk_class";

function SortableTh({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  center,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  sortDir: 1 | -1;
  onSort: (key: SortKey) => void;
  center?: boolean;
}) {
  const isActive = activeSortKey === sortKey;
  return (
    <th
      className={`${center ? "text-center" : "text-left"} text-[10.5px] uppercase tracking-wider border-b border-line select-none ${
        isActive ? "text-muted" : "text-faint"
      }`}
      aria-sort={isActive ? (sortDir === 1 ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={`cursor-pointer w-full px-3 py-2.5 flex items-center gap-1 hover:text-ink transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent ${
          center ? "justify-center" : "justify-start"
        }`}
      >
        {label}
        <ChevronDownIcon
          className={`transition-transform ${isActive ? "" : "opacity-30"} ${isActive && sortDir === 1 ? "rotate-180" : ""}`}
        />
      </button>
    </th>
  );
}

export default function RehabilitationActivities() {
  const router = useRouter();
  const activities = useActivities();
  const allAreas: RehabAreaSummary[] = useMemo(() => selectAreaSummaries(activities), [activities]);
  const zoneById = useMemo(() => new Map(MOCK_ZONES.map((z) => [z.zone_id, z])), []);

  const [municipalityFilter, setMunicipalityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [sortKey, setSortKey] = useState<SortKey>("latest_date");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortKey(key);
      setSortDir(-1); // most recent / highest count / highest risk first
    }
  }

  const municipalityOptions = useMemo(() => {
    const set = new Set<string>();
    allAreas.forEach((a) => {
      const m = zoneById.get(a.zone_id)?.municipality;
      if (m) set.add(m);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [allAreas, zoneById]);

  const filteredAreas = useMemo(() => {
    return allAreas.filter((a) => {
      const zone = zoneById.get(a.zone_id);
      if (municipalityFilter !== "all" && zone?.municipality !== municipalityFilter) return false;
      if (statusFilter !== "all" && a.latest_status !== statusFilter) return false;
      if (dateFrom && a.latest_date < dateFrom) return false;
      if (dateTo && a.latest_date > dateTo) return false;
      return true;
    });
  }, [allAreas, zoneById, municipalityFilter, statusFilter, dateFrom, dateTo]);

  const areas = useMemo(() => {
    return [...filteredAreas].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "latest_date") {
        cmp = a.latest_date.localeCompare(b.latest_date);
      } else if (sortKey === "activity_count") {
        cmp = a.activity_count - b.activity_count;
      } else if (sortKey === "risk_class") {
        const aRisk = zoneById.get(a.zone_id)?.risk_class;
        const bRisk = zoneById.get(b.zone_id)?.risk_class;
        const aRank = aRisk ? RISK_SORT_ORDER[aRisk] : -1;
        const bRank = bRisk ? RISK_SORT_ORDER[bRisk] : -1;
        cmp = aRank - bRank;
      }
      return cmp * sortDir;
    });
  }, [filteredAreas, zoneById, sortKey, sortDir]);

  const activeFilterCount =
    (municipalityFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (dateFrom !== "" ? 1 : 0) +
    (dateTo !== "" ? 1 : 0);

  function clearFilters() {
    setMunicipalityFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="max-w-[1800px] mx-auto px-10 pt-2 pb-14">
      <header className="pb-5 mb-6 border-b border-line">
        <div className="text-[10.5px] uppercase tracking-wider text-faint mb-1.5 flex items-center gap-1.5">
          <ArchiveIcon />
          Repository
        </div>
        <h1 className="font-display text-xl font-bold text-ink">Rehabilitation Activities</h1>
        <p className="text-[12.5px] text-muted mt-1.5">
          Areas with logged conservation work, and the timeline behind each one.
        </p>
      </header>

      <div className="flex items-start gap-2.5 text-[12.5px] text-blue-800 bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3.5 mb-6">
        <InfoIcon className="mt-0.5 shrink-0" />
        <p className="leading-relaxed">
          <strong>This is a repository, not a forecast.</strong> Figures below are aggregated from
          activities logged against each zone — area covered, status, and dates as reported by field
          teams. AETHER does not calculate or predict mangrove area gain from this data.
        </p>
      </div>

      {allAreas.length === 0 ? (
        <div className="bg-bg-panel border border-line rounded-2xl shadow-[0_2px_8px_-2px_rgba(22,36,30,0.08),0_1px_2px_rgba(22,36,30,0.04)] py-16 px-6 text-center">
          <p className="font-display text-base font-semibold text-ink mb-1.5">
            No rehabilitation activity recorded yet
          </p>
          <p className="text-[12.5px] text-muted">
            Logged zone activities will appear here once field teams start reporting.
          </p>
        </div>
      ) : (
        <div>
          <div className="rounded-lg border border-line-soft bg-bg-panel-alt/40 p-3.5 mb-3">
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
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
                    {REHAB_STATUSES.map((s) => (
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

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-faint font-medium mb-1.5">
                  From
                </label>
                <input
                  type="date"
                  aria-label="Filter activities from this date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className={`border font-mono text-[11px] px-2.5 py-[6px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${
                    dateFrom
                      ? "border-accent/50 bg-accent/10 text-accent font-semibold"
                      : "border-line bg-bg-panel text-ink focus:border-accent"
                  }`}
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-faint font-medium mb-1.5">
                  To
                </label>
                <input
                  type="date"
                  aria-label="Filter activities up to this date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className={`border font-mono text-[11px] px-2.5 py-[6px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors ${
                    dateTo
                      ? "border-accent/50 bg-accent/10 text-accent font-semibold"
                      : "border-line bg-bg-panel text-ink focus:border-accent"
                  }`}
                />
              </div>

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
              Showing <span className="text-muted font-medium">{areas.length.toLocaleString()}</span> of{" "}
              {allAreas.length.toLocaleString()} areas
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-line-soft">
            <table className="w-full border-collapse text-[12.5px] min-w-[840px]">
              <thead className="bg-bg-panel-alt">
                <tr>
                  <th className="text-left text-[10.5px] uppercase tracking-wider text-faint px-3 py-2.5 border-b border-line">
                    Area
                  </th>
                  <SortableTh
                    label="Latest Activity"
                    sortKey="latest_date"
                    activeSortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                  />
                  <SortableTh
                    label="Activities"
                    sortKey="activity_count"
                    activeSortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    center
                  />
                  <SortableTh
                    label="Risk"
                    sortKey="risk_class"
                    activeSortKey={sortKey}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    center
                  />
                  <th className="text-center text-[10.5px] uppercase tracking-wider text-faint px-3 py-2.5 border-b border-line">
                    Rehab. Status
                  </th>
                  <th className="px-3 py-2.5 border-b border-line w-8" />
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => {
                  const zone = zoneById.get(area.zone_id);
                  const href = `/rehabilitation-activities/${encodeURIComponent(area.zone_id)}`;
                  return (
                    <tr
                      key={area.zone_id}
                      tabIndex={0}
                      role="button"
                      aria-label={`View rehabilitation timeline for ${zone?.municipality ?? area.zone_id}`}
                      onClick={() => router.push(href)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          router.push(href);
                        }
                      }}
                      className="cursor-pointer hover:bg-bg-panel-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                    >
                      <td className="px-3 py-2.5 border-b border-line-soft">
                        <div className="text-ink font-medium">{zone?.municipality ?? area.zone_id}</div>
                        <div className="font-mono text-[11px] text-faint">{area.zone_id}</div>
                      </td>
                      <td className="font-mono px-3 py-2.5 border-b border-line-soft text-muted">
                        {formatIsoDate(area.latest_date)}
                      </td>
                      <td className="font-mono px-3 py-2.5 border-b border-line-soft text-center">
                        {area.activity_count}
                      </td>
                      <td className="px-2 py-2.5 border-b border-line-soft">
                        <div className="flex justify-center">
                          {zone ? (
                            <span
                              className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10.5px] ${RISK_PILL_CLASS[zone.risk_class]}`}
                            >
                              {zone.risk_class.toUpperCase()}
                            </span>
                          ) : (
                            <span className="text-faint font-mono text-[11px]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2.5 border-b border-line-soft">
                        <div className="flex justify-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] whitespace-nowrap ${REHAB_STATUS_PILL_CLASS[area.latest_status]}`}
                          >
                            {area.latest_status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 border-b border-line-soft text-accent">
                        <ChevronDownIcon className="-rotate-90" />
                      </td>
                    </tr>
                  );
                })}

                {areas.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-faint font-mono text-[12px]">
                      No areas match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
