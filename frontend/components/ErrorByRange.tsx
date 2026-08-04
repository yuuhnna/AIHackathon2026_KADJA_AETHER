"use client";

import { useId, useState } from "react";
import type { ErrorByRangeItem } from "@/lib/types";
import { WarningIcon } from "@/components/icons";

const WIDTH = 680;
const HEIGHT = 122;
const MARGIN = { top: 20, right: 14, bottom: 12, left: 26 };
const PLOT_WIDTH = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_HEIGHT = HEIGHT - MARGIN.top - MARGIN.bottom;
const BAR_WIDTH = 30;
const MIN_BAR_HEIGHT = 2.5;
const TICK_COUNT = 4;
const LOW_SAMPLE_THRESHOLD = 20;

// Rounds a value up to a "nice" axis ceiling (1/2/5 x a power of ten) so
// gridlines land on numbers a reader can actually estimate against — e.g.
// 98.47 -> 100, not some unlabelable value like 98.47.
function niceCeiling(value: number): number {
  if (value <= 0) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const normalized = value / magnitude;
  const niceNormalized = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceNormalized * magnitude;
}

// Builds a bar path that's rounded only at the top — square where it meets
// the baseline. SVG <rect rx> would round all four corners.
function roundedTopBarPath(x: number, y: number, width: number, height: number, radius: number): string {
  const r = Math.min(radius, width / 2, height);
  return `
    M ${x} ${y + height}
    L ${x} ${y + r}
    Q ${x} ${y} ${x + r} ${y}
    L ${x + width - r} ${y}
    Q ${x + width} ${y} ${x + width} ${y + r}
    L ${x + width} ${y + height}
    Z
  `;
}

// Data-driven text alternative for screen readers — describes the trend
// instead of leaving the SVG's visual encoding as the only representation.
function describeTrend(items: ErrorByRangeItem[]): string {
  const sorted = [...items].sort((a, b) => a.mae - b.mae);
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];
  const flagged = items.filter((i) => i.sampleSize < LOW_SAMPLE_THRESHOLD);

  let text = `Average prediction error by severity range. Lowest in ${lowest.range} at ${lowest.mae.toFixed(
    2
  )} hectares, highest in ${highest.range} at ${highest.mae.toFixed(2)} hectares.`;

  if (flagged.length > 0) {
    const names = flagged.map((i) => `${i.range} (n=${i.sampleSize})`).join(" and ");
    text += ` ${names} ${flagged.length === 1 ? "is" : "are"} based on a sample smaller than ${LOW_SAMPLE_THRESHOLD} and should be read with caution.`;
  }

  return text;
}

export default function ErrorByRange({ items }: { items: ErrorByRangeItem[] }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const gradientId = useId();
  const hatchId = useId();
  const descId = useId();

  if (items.length === 0) return null;

  const hasLowSample = items.some((i) => i.sampleSize < LOW_SAMPLE_THRESHOLD);
  const maxValue = niceCeiling(Math.max(...items.map((i) => i.errorMax)));
  const yFor = (value: number) => MARGIN.top + PLOT_HEIGHT - (value / maxValue) * PLOT_HEIGHT;
  const baselineY = yFor(0);

  const slotWidth = PLOT_WIDTH / items.length;
  const ticks = Array.from({ length: TICK_COUNT + 1 }, (_, i) => (maxValue / TICK_COUNT) * i);

  return (
    <div>
      <div className="relative">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto block"
          role="img"
          aria-label="Prediction error by severity range"
          aria-describedby={descId}
        >
          <desc id={descId}>{describeTrend(items)}</desc>

          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-accent)" />
              <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0.72" />
            </linearGradient>
            <pattern id={hatchId} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="5" height="5" fill="var(--color-risk-moderate)" fillOpacity="0.25" />
              <line x1="0" y1="0" x2="0" y2="5" stroke="var(--color-risk-moderate)" strokeWidth="1.5" />
            </pattern>
          </defs>

          {/* Gridlines + y-axis labels, in hectares — recessive hairlines,
              with the zero baseline drawn a touch stronger to anchor the
              chart. */}
          {ticks.map((tick) => {
            const y = yFor(tick);
            const isBaseline = tick === 0;
            return (
              <g key={tick}>
                <line
                  x1={MARGIN.left}
                  x2={WIDTH - MARGIN.right}
                  y1={y}
                  y2={y}
                  className={isBaseline ? "stroke-line" : "stroke-line-soft"}
                  strokeWidth={isBaseline ? 1.25 : 1}
                />
                <text x={MARGIN.left - 6} y={y} textAnchor="end" dominantBaseline="middle" className="fill-faint font-mono" fontSize={8}>
                  {tick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* y-axis rule */}
          <line x1={MARGIN.left} x2={MARGIN.left} y1={MARGIN.top} y2={baselineY} className="stroke-line" strokeWidth={1} />

          {items.map((item, index) => {
            const slotX = MARGIN.left + index * slotWidth;
            const barX = slotX + (slotWidth - BAR_WIDTH) / 2;
            const isHovered = hovered === item.range;
            const isLowSample = item.sampleSize < LOW_SAMPLE_THRESHOLD;

            const barTopValue = Math.max(item.mae, (maxValue * MIN_BAR_HEIGHT) / PLOT_HEIGHT);
            const barY = yFor(barTopValue);
            const barHeight = Math.max(baselineY - barY, MIN_BAR_HEIGHT);

            const barCenterX = barX + BAR_WIDTH / 2;
            const maxLabelY = yFor(item.errorMax) - 3;

            // Always-visible value labels (not hover-gated) — MAE sits just
            // above the bar, max error above that. Keep a minimum gap
            // between the two so short bars don't collide.
            const naturalMaeLabelY = barY - 3;
            const maeLabelY = naturalMaeLabelY < maxLabelY + 9 ? maxLabelY + 9 : naturalMaeLabelY;

            return (
              <g
                key={item.range}
                onMouseEnter={() => setHovered(item.range)}
                onMouseLeave={() => setHovered((current) => (current === item.range ? null : current))}
                className="cursor-default"
              >
                <rect x={slotX} y={MARGIN.top} width={slotWidth} height={PLOT_HEIGHT} fill="transparent" />

                <path
                  d={roundedTopBarPath(barX, barY, BAR_WIDTH, barHeight, 3)}
                  fill={`url(#${gradientId})`}
                  stroke={isHovered ? "var(--color-accent)" : "none"}
                  strokeWidth={isHovered ? 1.5 : 0}
                />
                {isLowSample && (
                  <path
                    d={roundedTopBarPath(barX, barY, BAR_WIDTH, barHeight, 3)}
                    fill={`url(#${hatchId})`}
                    stroke="var(--color-risk-moderate)"
                    strokeWidth={1}
                    strokeDasharray="2.5 2"
                  />
                )}

                <text x={barCenterX} y={maeLabelY} textAnchor="middle" className="font-mono fill-ink" fontSize={8.5} fontWeight={600}>
                  {item.mae.toFixed(2)}
                </text>
                <text x={barCenterX} y={maxLabelY} textAnchor="middle" className="font-mono fill-faint" fontSize={7}>
                  max {item.errorMax.toFixed(2)}
                </text>
              </g>
            );
          })}
        </svg>

        {items.map((item, index) => {
          const slotX = (index / items.length) * 100;
          const isHovered = hovered === item.range;
          if (!isHovered) return null;

          return (
            <div
              key={item.range}
              role="tooltip"
              className="pointer-events-none absolute z-20 w-56 -translate-x-1/2 rounded-md border border-line bg-bg-panel px-3 py-2.5 text-[11px] leading-relaxed shadow-lg"
              style={{ left: `${slotX + 100 / items.length / 2}%`, top: 0 }}
            >
              <div className="font-semibold text-ink mb-1">{item.range}</div>
              <div className="flex justify-between gap-3 text-muted">
                <span>Avg. error (MAE)</span>
                <span className="font-mono text-ink whitespace-nowrap">{item.mae.toFixed(2)} ha</span>
              </div>
              <div className="flex justify-between gap-3 text-muted">
                <span>Observed range</span>
                <span className="font-mono text-ink whitespace-nowrap">
                  {item.errorMin.toFixed(2)}–{item.errorMax.toFixed(2)} ha
                </span>
              </div>
              <div className="flex justify-between gap-3 text-muted">
                <span>Sample size</span>
                <span className="font-mono text-ink whitespace-nowrap">
                  n={item.sampleSize.toLocaleString()}
                  {item.sampleSize < LOW_SAMPLE_THRESHOLD && (
                    <span className="text-risk-moderate"> (small)</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="flex"
        style={{ paddingLeft: `${(MARGIN.left / WIDTH) * 100}%`, paddingRight: `${(MARGIN.right / WIDTH) * 100}%` }}
      >
        {items.map((item) => {
          const isLowSample = item.sampleSize < LOW_SAMPLE_THRESHOLD;
          return (
            <div key={item.range} className="flex-1 text-center">
              <div className="font-mono text-[10px] text-ink font-medium">{item.range}</div>
              <div
                className={`font-mono text-[9px] flex items-center justify-center gap-0.5 ${
                  isLowSample ? "text-risk-moderate" : "text-faint"
                }`}
              >
                {isLowSample && <WarningIcon className="w-2 h-2 shrink-0" />}
                n={item.sampleSize.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-x-3 gap-y-0.5 mt-1.5 text-[10px] text-muted flex-wrap">
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-1.5 rounded-t-sm bg-accent" />
          MAE
        </span>
        <span className="flex items-center gap-1 text-faint">
          <span className="font-mono">max</span>
          Highest error observed
        </span>
        {hasLowSample && (
          <span className="flex items-center gap-1 text-risk-moderate">
            <WarningIcon className="w-2 h-2" />
            n &lt; {LOW_SAMPLE_THRESHOLD}
          </span>
        )}
      </div>
    </div>
  );
}
