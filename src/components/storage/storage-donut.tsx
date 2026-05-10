"use client";

import { formatBytes, formatPercent } from "@/lib/utils";

const COLORS = {
  Images: "#38bdf8",
  Containers: "#f59e0b",
  Volumes: "#10b981",
  "Build Cache": "#f43f5e",
  Other: "#6b7280",
};

interface Slice {
  name: string;
  bytes: number;
}

export function StorageDonut({ data }: { data: Slice[] }) {
  const total = data.reduce((s, d) => s + d.bytes, 0);
  const sorted = [...data].sort((a, b) => b.bytes - a.bytes);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest" style={{ color: "#3a3a40" }}>Total Docker Usage</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-white">{formatBytes(total)}</p>
        </div>
        <p className="pb-1 text-xs" style={{ color: "#6b6b70" }}>{sorted.length} categories</p>
      </div>

      <div className="flex h-3 overflow-hidden rounded-full" style={{ background: "#1a1a1e", border: "1px solid #222226" }}>
        {sorted.map((d) => (
          <div
            key={d.name}
            title={`${d.name}: ${formatBytes(d.bytes)}`}
            style={{
              width: `${formatPercent(d.bytes, total)}%`,
              background: COLORS[d.name as keyof typeof COLORS] ?? COLORS.Other,
            }}
          />
        ))}
      </div>

      <div className="space-y-3">
        {sorted.map((d) => {
          const color = COLORS[d.name as keyof typeof COLORS] ?? COLORS.Other;
          const percent = formatPercent(d.bytes, total);

          return (
            <div key={d.name} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
                  <span className="truncate text-sm font-medium" style={{ color: "#f0f0f3" }}>{d.name}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs font-mono tabular-nums">
                  <span style={{ color: "#a0a0a6" }}>{formatBytes(d.bytes)}</span>
                  <span style={{ color: "#3a3a40" }}>{percent}%</span>
                </div>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "#1a1a1e" }}>
                <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
