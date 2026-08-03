import type { ErrorByRangeItem } from "@/lib/types";

const CHART_HEIGHT = 160;

export default function ErrorByRange({ items }: { items: ErrorByRangeItem[] }) {
  const maxError = Math.max(...items.map((i) => i.errorMax));

  return (
    <div>
      <div className="flex items-end gap-6" style={{ height: CHART_HEIGHT }}>
        {items.map((item) => {
          const bottomPct = (item.errorMin / maxError) * 100;
          const topPct = (item.errorMax / maxError) * 100;
          const maePct = (item.mae / maxError) * 100;
          return (
            <div key={item.range} className="flex-1 relative h-full">
              <div
                className="absolute left-1/2 -translate-x-1/2 w-2/3 bg-accent/15 border border-accent rounded-sm"
                style={{ bottom: `${bottomPct}%`, height: `${topPct - bottomPct}%` }}
              />
              <div
                className="absolute left-1/2 -translate-x-1/2 w-2/3 h-[2px] bg-accent"
                style={{ bottom: `${maePct}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex gap-6 mt-2">
        {items.map((item) => (
          <div key={item.range} className="flex-1 text-center">
            <div className="font-mono text-[10.5px] text-ink font-medium">{item.range}</div>
            <div className="font-mono text-[10px] text-faint">n={item.sampleSize.toLocaleString()}</div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm bg-accent/15 border border-accent" />
          Range of error observed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-[2px] bg-accent" />
          Average error (MAE)
        </span>
      </div>
    </div>
  );
}