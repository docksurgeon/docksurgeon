"use client";

import { useEffect, useState } from "react";
import { HardDrive, RefreshCw } from "lucide-react";
import { StorageDonut } from "@/components/storage/storage-donut";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes, formatPercent } from "@/lib/utils";

interface BreakdownData {
  images: { Id: string; RepoTags: string[] | null; Size: number; Containers: number }[];
  containers: { Id: string; Names: string[]; SizeRootFs: number; State: string }[];
  volumes: { Name: string; UsageData?: { Size: number } }[];
  df: { BuildCache: { Size: number }[] } | null;
}

interface DiskMount {
  filesystem: string;
  total: number;
  used: number;
  available: number;
  usePercent: number;
  mountpoint: string;
}

interface HealthData {
  disk: DiskMount[];
}

export default function StoragePage() {
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    setError("");
    Promise.allSettled([
      fetch("/api/storage/breakdown").then((r) => r.json()),
      fetch("/api/system/health").then((r) => r.json()),
    ]).then(([b, h]) => {
      if (b.status === "fulfilled") setBreakdown(b.value);
      else setError("Failed to load Docker storage data");
      if (h.status === "fulfilled") setHealth(h.value);
    }).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  const imageBytes = breakdown?.images.reduce((s, i) => s + i.Size, 0) ?? 0;
  const containerBytes = breakdown?.containers.reduce((s, c) => s + (c.SizeRootFs ?? 0), 0) ?? 0;
  const volumeBytes = breakdown?.volumes.reduce((s, v) => s + (v.UsageData?.Size ?? 0), 0) ?? 0;
  const cacheBytes = (breakdown?.df?.BuildCache ?? []).reduce((s, b) => s + b.Size, 0);

  const donutData = [
    { name: "Images",      bytes: imageBytes },
    { name: "Containers",  bytes: containerBytes },
    { name: "Volumes",     bytes: volumeBytes },
    { name: "Build Cache", bytes: cacheBytes },
  ].filter((d) => d.bytes > 0);

  const imageItems = (breakdown?.images ?? [])
    .sort((a, b) => b.Size - a.Size).slice(0, 8)
    .map((img) => ({ name: img.RepoTags?.[0] ?? img.Id.slice(7, 19), bytes: img.Size, inUse: img.Containers > 0 }));

  const containerItems = (breakdown?.containers ?? [])
    .sort((a, b) => (b.SizeRootFs ?? 0) - (a.SizeRootFs ?? 0)).slice(0, 8)
    .map((c) => ({ name: c.Names?.[0]?.replace("/", "") ?? c.Id.slice(0, 12), bytes: c.SizeRootFs ?? 0, inUse: c.State === "running" }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Storage</h1>
          <p className="text-sm mt-0.5" style={{ color: "#a1a1aa" }}>Disk and Docker storage analysis</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ background: "#1a1a1e", border: "1px solid #222226", color: "#d4d4d8" }}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Disk mounts */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" style={{ background: "#1a1a1e" }} />)}
        </div>
      ) : health?.disk && health.disk.length > 0 ? (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#71717a" }}>Disk Mounts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {health.disk.map((disk) => (
              <DiskCard key={disk.mountpoint} disk={disk} />
            ))}
          </div>
        </div>
      ) : null}

      {/* Docker storage */}
      {error ? (
        <div className="rounded-xl p-4 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          {error} — is the Docker socket mounted?
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-72 rounded-xl" style={{ background: "#1a1a1e" }} />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" style={{ background: "#1a1a1e" }} />)}
          </div>
        </div>
      ) : breakdown ? (
        <>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: "#71717a" }}>Docker Storage</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Donut */}
              <div className="rounded-xl p-5" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
                {donutData.length > 0
                  ? <StorageDonut data={donutData} />
                  : <p className="text-sm text-center py-8" style={{ color: "#a1a1aa" }}>No Docker storage data</p>
                }
              </div>

              {/* Breakdown stats */}
              <div className="space-y-3">
                <StorageStat label="Images" count={breakdown.images.length} bytes={imageBytes} color="#38bdf8" />
                <StorageStat label="Containers" count={breakdown.containers.length} bytes={containerBytes} color="#f59e0b" />
                <StorageStat label="Volumes" count={breakdown.volumes.length} bytes={volumeBytes} color="#10b981" />
                <StorageStat label="Build Cache" count={breakdown.df?.BuildCache?.length ?? 0} bytes={cacheBytes} color="#f43f5e" />
              </div>
            </div>
          </div>

          {/* Top consumers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TopList title="Largest Images" items={imageItems} color="#38bdf8" />
            <TopList title="Largest Containers" items={containerItems} color="#f59e0b" />
          </div>
        </>
      ) : null}
    </div>
  );
}

function DiskCard({ disk }: { disk: DiskMount }) {
  const pct = disk.usePercent;
  const danger = pct >= 85;
  const warn = pct >= 70;
  const barColor = danger ? "#ef4444" : warn ? "#f59e0b" : "#10b981";
  const device = disk.filesystem.split("/").pop() ?? disk.filesystem;
  const mounted = disk.mountpoint !== "Not mounted";

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
      <div className="flex items-center gap-2">
        <HardDrive className="h-4 w-4 shrink-0" style={{ color: "#a1a1aa" }} />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono font-medium truncate" style={{ color: "#f0f0f3" }}>{device}</p>
          <p className="text-[11px] font-mono truncate" style={{ color: "#a1a1aa" }}>{disk.mountpoint}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: mounted ? "rgba(16,185,129,0.1)" : "rgba(160,160,166,0.1)", color: mounted ? "#10b981" : "#d4d4d8", border: mounted ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(160,160,166,0.2)" }}>{mounted ? "mounted" : "unmounted"}</span>
          <span className="text-xs font-mono" style={{ color: danger ? "#ef4444" : "#f0f0f3" }}>{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "#1a1a1e" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: barColor }} />
      </div>
      <div className="flex justify-between text-xs" style={{ color: "#a1a1aa" }}>
        <span>{mounted ? `${formatBytes(disk.used)} used` : "No usage data"}</span>
        <span>{mounted ? `${formatBytes(disk.available)} free · ` : ""}{formatBytes(disk.total)} total</span>
      </div>
    </div>
  );
}

function StorageStat({ label, count, bytes, color }: { label: string; count: number; bytes: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}14` }}>
        <div className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs" style={{ color: "#a1a1aa" }}>{count} items</p>
      </div>
      <p className="text-sm font-mono font-medium tabular-nums" style={{ color: bytes > 0 ? "#f0f0f3" : "#71717a" }}>
        {formatBytes(bytes)}
      </p>
    </div>
  );
}

function TopList({ title, items, color }: { title: string; items: { name: string; bytes: number; inUse: boolean }[]; color: string }) {
  const max = items[0]?.bytes ?? 1;
  return (
    <div className="rounded-xl p-5 space-y-4" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
      <p className="text-sm font-medium text-white">{title}</p>
      {items.length === 0
        ? <p className="text-sm" style={{ color: "#a1a1aa" }}>None found</p>
        : <div className="space-y-2.5">
            {items.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono truncate" style={{ color: "#d4d4d8" }}>{item.name}</span>
                    {item.inUse && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>in use</span>}
                  </div>
                  <span className="text-xs font-mono tabular-nums shrink-0" style={{ color: "#a1a1aa" }}>{formatBytes(item.bytes)}</span>
                </div>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: "#1a1a1e" }}>
                  <div className="h-full rounded-full" style={{ width: `${formatPercent(item.bytes, max)}%`, background: color, opacity: 0.75 }} />
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
