"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MOCK_ZONES } from "@/lib/mockZones";
import { selectZoneActivities, useActivities } from "@/lib/activityStore";
import { REHAB_STATUS_PILL_CLASS } from "@/lib/colors";
import { formatIsoDate } from "@/lib/dates";
import { ZONE_AREA_HA } from "@/lib/types";
import { ChevronLeftIcon, PersonIcon, CalendarIcon } from "@/components/icons";

export default function RehabilitationAreaPage() {
  const params = useParams<{ zoneId: string }>();
  const zoneId = decodeURIComponent(params.zoneId);

  const zone = useMemo(() => MOCK_ZONES.find((z) => z.zone_id === zoneId) ?? null, [zoneId]);
  const activities = useActivities();
  const zoneActivities = useMemo(
    () => selectZoneActivities(activities, zoneId),
    [activities, zoneId]
  );

  return (
    <div className="max-w-[1000px] mx-auto px-10 pt-2 pb-14">
      <Link
        href="/rehabilitation-activities"
        className="inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ink transition-colors mb-5 mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
      >
        <ChevronLeftIcon />
        Rehabilitation Activities
      </Link>

      {!zone ? (
        <div className="bg-bg-panel border border-line rounded-2xl py-16 px-6 text-center">
          <p className="font-display text-base font-semibold text-ink mb-1.5">Zone not found</p>
          <p className="text-[12.5px] text-muted">
            &quot;{zoneId}&quot; doesn&apos;t match a monitored zone.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-bg-panel-alt border border-line rounded-2xl overflow-hidden mb-6 flex flex-col sm:flex-row">
            <div className="p-5 flex-1">
              <h1 className="font-display text-xl font-bold text-ink">{zone.municipality}</h1>
              <div className="font-mono text-[11px] text-faint mt-0.5 mb-3">{zone.zone_id}</div>
              <div className="flex gap-6 text-[12.5px]">
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-faint mb-0.5">
                    Total Cover
                  </div>
                  <div className="font-display font-semibold text-ink">
                    {ZONE_AREA_HA.toFixed(1)} ha
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-wider text-faint mb-0.5">
                    Last Assessed
                  </div>
                  <div className="font-display font-semibold text-ink">
                    {zoneActivities[0] ? formatIsoDate(zoneActivities[0].date) : "—"}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-ink text-white p-5 flex flex-col justify-center sm:w-[220px] shrink-0">
              <div className="text-[10.5px] uppercase tracking-wider text-white/60 mb-1">
                Expected Percentage Loss
              </div>
              <div className="font-display text-[28px] font-semibold">
                {zone.expected_area_loss.toFixed(1)}%
              </div>
            </div>
          </div>

          <h2 className="font-display text-sm font-semibold text-ink mb-4">Recent Activities</h2>

          {zoneActivities.length === 0 ? (
            <div className="bg-bg-panel border border-line rounded-2xl py-12 px-6 text-center">
              <p className="text-[12.5px] text-muted">No activity logged for this area yet.</p>
            </div>
          ) : (
            <ol className="relative">
              {zoneActivities.map((activity, i) => (
                <li key={activity.id} className="relative pl-8 pb-6 last:pb-0">
                  {i !== zoneActivities.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute left-[5px] top-3 bottom-0 w-px bg-line"
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-accent/15"
                  />

                  <div className="font-mono text-[11px] text-faint mb-1.5 inline-flex items-center gap-1.5">
                    <CalendarIcon />
                    {formatIsoDate(activity.date)}
                  </div>

                  <div className="bg-bg-panel border border-line rounded-xl p-4">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] ${REHAB_STATUS_PILL_CLASS[activity.status]}`}
                      >
                        {activity.status.toUpperCase()}
                      </span>
                      <span className="inline-block px-2 py-0.5 rounded-sm font-mono text-[10px] bg-bg-panel-alt border border-line text-muted">
                        {activity.action_category}
                      </span>
                    </div>
                    <div className="text-[13px] font-semibold text-ink mb-1">
                      {activity.recommendation_name}
                    </div>
                    {activity.action_taken && (
                      <p className="text-[12px] text-muted leading-relaxed mb-2">
                        {activity.action_taken}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-faint italic">
                      {activity.officer_name && (
                        <span className="inline-flex items-center gap-1.5">
                          <PersonIcon />
                          {activity.officer_name}
                        </span>
                      )}
                      {activity.implementing_unit && <span>{activity.implementing_unit}</span>}
                      {activity.area_covered_ha !== undefined && (
                        <span>{activity.area_covered_ha.toFixed(1)} ha covered</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
