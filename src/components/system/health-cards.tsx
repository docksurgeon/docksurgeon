"use client";

import { formatBytes, formatUptime, formatPercent } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface HealthData {
  disk: { mountpoint: string; used: number; total: number; usePercent: number }[];
  memory: { used: number; total: number } | null;
  uptime: number;
  docker: { containers: number; images: number; version: string } | null;
}

export function HealthCards({ data }: { data: HealthData }) {
  const totalDiskUsed = data.disk.reduce((s, d) => s + d.used, 0);
  const totalDiskTotal = data.disk.reduce((s, d) => s + d.total, 0);
  const diskPct = totalDiskTotal > 0 ? Math.round((totalDiskUsed / totalDiskTotal) * 100) : 0;
  const memPct = data.memory ? formatPercent(data.memory.used, data.memory.total) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard
        label="Disk Usage"
        value={totalDiskTotal > 0 ? `${diskPct}%` : "—"}
        sub={totalDiskTotal > 0 ? `${formatBytes(totalDiskUsed)} / ${formatBytes(totalDiskTotal)} · ${data.disk.length} vol` : "No data"}
        percent={diskPct}
        danger={diskPct >= 85}
        color="emerald"
      />
      <MetricCard
        label="Memory"
        value={data.memory ? `${memPct}%` : "—"}
        sub={data.memory ? `${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}` : "No data"}
        percent={memPct}
        color="amber"
      />
      <MetricCard
        label="Uptime"
        value={formatUptime(data.uptime)}
        sub="server running"
        color="emerald"
      />
      <MetricCard
        label="Docker"
        value={data.docker ? String(data.docker.containers) : "—"}
        sub={data.docker ? `containers · v${data.docker.version}` : "Not connected"}
        color="amber"
      />
    </div>
  );
}

export function HealthCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
          <Skeleton className="h-3 w-20 bg-zinc-800" />
          <Skeleton className="h-7 w-16 bg-zinc-800" />
          <Skeleton className="h-1.5 w-full bg-zinc-800" />
          <Skeleton className="h-3 w-28 bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

const colorMap = {
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
};

function MetricCard({
  label, value, sub, percent, danger, color = "emerald",
}: {
  label: string;
  value: string;
  sub: string;
  percent?: number;
  danger?: boolean;
  color?: keyof typeof colorMap;
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-2">
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className={`text-2xl font-bold tabular-nums tracking-tight ${danger ? "text-red-400" : "text-white"}`}>
        {value}
      </p>
      {percent !== undefined && (
        <div className="h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${danger ? "bg-red-500" : colorMap[color]}`}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
        </div>
      )}
      <p className="text-xs text-zinc-600 truncate">{sub}</p>
    </div>
  );
}
