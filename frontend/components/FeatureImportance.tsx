import type { FeatureImportanceItem } from "@/lib/types";

export default function FeatureImportance({ items }: { items: FeatureImportanceItem[] }) {
  const maxImportance = Math.max(...items.map((i) => i.importance));

  return (
    <div className="flex flex-col gap-[14px]">
      {items.map((item) => (
        <div key={item.feature} className="flex items-center gap-3 text-xs">
          <div className="w-[220px] shrink-0 text-muted truncate" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 h-1.5 bg-ink/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent rounded-full"
              style={{ width: `${(item.importance / maxImportance) * 100}%` }}
            />
          </div>
          <div className="w-12 text-right font-mono text-[11px] text-muted shrink-0">
            {(item.importance * 100).toFixed(1)}%
          </div>
        </div>
      ))}
    </div>
  );
}
