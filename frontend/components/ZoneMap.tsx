"use client";

import type { ZoneSummary } from "@/lib/types";
import { RISK_COLOR } from "@/lib/colors";

const W = 640;
const H = 460;
const PAD = 30;

export default function ZoneMap({
  zones,
  selectedZoneId,
  onSelect,
}: {
  zones: ZoneSummary[];
  selectedZoneId: string | null;
  onSelect: (zoneId: string) => void;
}) {
  if (zones.length === 0) return null;

  const lats = zones.map((z) => z.lat);
  const lons = zones.map((z) => z.lon);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const lonMin = Math.min(...lons);
  const lonMax = Math.max(...lons);

  const x = (lon: number) => PAD + ((lon - lonMin) / (lonMax - lonMin)) * (W - 2 * PAD);
  const y = (lat: number) => H - PAD - ((lat - latMin) / (latMax - latMin)) * (H - 2 * PAD);

  const gridLines = Array.from({ length: 7 }, (_, i) => i);

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
        {gridLines.map((i) => {
          const gx = PAD + (i * (W - 2 * PAD)) / 6;
          const gy = PAD + (i * (H - 2 * PAD)) / 6;
          return (
            <g key={i}>
              <line x1={gx} y1={PAD} x2={gx} y2={H - PAD} stroke="#1D3E38" strokeWidth={1} />
              <line x1={PAD} y1={gy} x2={W - PAD} y2={gy} stroke="#1D3E38" strokeWidth={1} />
            </g>
          );
        })}
        <rect
          x={PAD}
          y={PAD}
          width={W - 2 * PAD}
          height={H - 2 * PAD}
          fill="none"
          stroke="#28524B"
        />
        {zones.map((z) => {
          const r = 2.5 + z.vulnerability_score * 7;
          const isSelected = z.zone_id === selectedZoneId;
          return (
            <circle
              key={z.zone_id}
              cx={x(z.lon)}
              cy={y(z.lat)}
              r={r}
              fill={RISK_COLOR[z.risk_class]}
              opacity={isSelected ? 1 : 0.85}
              stroke={isSelected ? "#E9F2ED" : "none"}
              strokeWidth={isSelected ? 1.5 : 0}
              className="cursor-pointer transition-opacity hover:opacity-100"
              onClick={() => onSelect(z.zone_id)}
            />
          );
        })}
      </svg>
      <div className="flex gap-4 mt-2.5 flex-wrap font-mono text-[11px] text-muted">
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
        <span>Marker size = predicted vulnerability</span>
      </div>
    </div>
  );
}