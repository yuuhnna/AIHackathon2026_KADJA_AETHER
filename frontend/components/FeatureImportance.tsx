"use client";

import { useState } from "react";
import type { FeatureImportanceItem } from "@/lib/types";
import { FEATURE_DESCRIPTIONS } from "@/lib/colors";

export default function FeatureImportance({ items }: { items: FeatureImportanceItem[] }) {
  const maxImportance = Math.max(...items.map((i) => i.importance));
  // Driven by actual mouse events rather than CSS-only :hover/group-hover —
  // more robust across browsers/input devices than relying purely on
  // hover-variant CSS classes being matched and painted.
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      {items.map((item, index) => {
        // Rows in the back half of the list sit near the panel's bottom
        // edge, where a tooltip opening downward has nowhere to go before
        // the panel clips it — open those upward instead.
        const openUpward = index >= Math.ceil(items.length / 2);
        const isHovered = hoveredFeature === item.feature;

        return (
          <div
            key={item.feature}
            className={`relative flex items-center gap-2.5 text-xs py-1 -mx-1.5 px-1.5 rounded-sm cursor-help transition-colors ${
              isHovered ? "bg-bg-panel-alt" : ""
            }`}
            onMouseEnter={() => setHoveredFeature(item.feature)}
            onMouseLeave={() =>
              setHoveredFeature((current) => (current === item.feature ? null : current))
            }
          >
            <div className="w-[190px] shrink-0 text-muted truncate">{item.label}</div>
            <div className="flex-1 h-2 bg-ink/10 border border-line rounded-full overflow-hidden">
              <div
                className="h-full bg-accent"
                style={{ width: `${(item.importance / maxImportance) * 100}%` }}
              />
            </div>
            <div className="w-11 text-right font-mono text-[11px] text-faint">
              {(item.importance * 100).toFixed(1)}%
            </div>

            {isHovered && FEATURE_DESCRIPTIONS[item.feature] && (
              <div
                role="tooltip"
                className={`pointer-events-none absolute left-0 z-20 w-72 rounded-md border border-line bg-bg-panel px-3 py-2.5 text-[11px] normal-case tracking-normal font-normal text-muted leading-relaxed shadow-lg ${
                  openUpward ? "bottom-full mb-2" : "top-full mt-2"
                }`}
              >
                <span className="block font-semibold text-ink mb-1">{item.label}</span>
                {FEATURE_DESCRIPTIONS[item.feature]}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
