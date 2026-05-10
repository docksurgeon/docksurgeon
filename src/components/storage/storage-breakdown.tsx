"use client";

import { formatBytes, formatPercent } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface Item {
  name: string;
  tag?: string;
  bytes: number;
  meta?: string;
  inUse?: boolean;
}

interface StorageBreakdownProps {
  title: string;
  items: Item[];
  total: number;
  color?: string;
}

export function StorageBreakdown({ title, items, total, color = "bg-primary" }: StorageBreakdownProps) {
  const sorted = [...items].sort((a, b) => b.bytes - a.bytes).slice(0, 10);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">None found</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((item, i) => {
            const pct = formatPercent(item.bytes, total);
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="truncate font-mono text-xs">{item.name}</span>
                    {item.inUse && (
                      <Badge variant="secondary" className="text-xs shrink-0">in use</Badge>
                    )}
                    {item.meta && (
                      <span className="text-muted-foreground text-xs shrink-0">{item.meta}</span>
                    )}
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                    {formatBytes(item.bytes)}
                  </span>
                </div>
                <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
