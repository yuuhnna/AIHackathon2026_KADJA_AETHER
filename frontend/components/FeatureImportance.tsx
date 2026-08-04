import type { FeatureImportanceItem } from "@/lib/types";

export default function FeatureImportance({ items }: { items: FeatureImportanceItem[] }) {
  const maxImportance = Math.max(...items.map((i) => i.importance));

  return (
    <div className="flex flex-col gap-[11px]">
      {items.map((item) => (
        <div key={item.feature} className="flex items-center gap-2.5 text-xs">
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
        </div>
      ))}
    </div>
  );
}
