"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Trash2, HardDrive, ScrollText, AlertCircle } from "lucide-react";
import { HealthCards, HealthCardsSkeleton } from "@/components/system/health-cards";
import { StorageDonut } from "@/components/storage/storage-donut";
import { Skeleton } from "@/components/ui/skeleton";
import { formatBytes } from "@/lib/utils";
import type { CleanupPreview } from "@/types/docker";

interface HealthData {
  disk: { mountpoint: string; used: number; total: number; usePercent: number }[];
  memory: { used: number; total: number } | null;
  uptime: number;
  docker: { containers: number; images: number; version: string } | null;
}

interface BreakdownData {
  images: { Size: number }[];
  containers: { SizeRootFs: number }[];
  volumes: { UsageData?: { Size: number } }[];
  df: { BuildCache: { Size: number }[] } | null;
}

export default function OverviewPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownData | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [storageLoading, setStorageLoading] = useState(true);
  const [cleanupPreview, setCleanupPreview] = useState<CleanupPreview | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(true);
  const [healthError, setHealthError] = useState(false);

  useEffect(() => {
    fetch("/api/system/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealthError(true))
      .finally(() => setHealthLoading(false));

    fetch("/api/storage/breakdown")
      .then((r) => r.json())
      .then(setBreakdown)
      .catch(() => {})
      .finally(() => setStorageLoading(false));

    fetch("/api/cleanup/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "all" }),
    })
      .then((r) => r.json())
      .then(setCleanupPreview)
      .catch(() => {})
      .finally(() => setCleanupLoading(false));
  }, []);

  const donutData = breakdown ? [
    { name: "Images",      bytes: breakdown.images.reduce((s, i) => s + (i.Size ?? 0), 0) },
    { name: "Containers",  bytes: breakdown.containers.reduce((s, c) => s + (c.SizeRootFs ?? 0), 0) },
    { name: "Volumes",     bytes: breakdown.volumes.reduce((s, v) => s + (v.UsageData?.Size ?? 0), 0) },
    { name: "Build Cache", bytes: (breakdown.df?.BuildCache ?? []).reduce((s, b) => s + b.Size, 0) },
  ].filter((d) => d.bytes > 0) : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Overview</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6b6b70" }}>Server health and Docker storage</p>
      </div>

      {healthLoading ? <HealthCardsSkeleton /> :
       healthError ? <ErrorBanner message="Could not connect to Docker socket" /> :
       health ? <HealthCards data={health} /> : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Storage donut */}
        <div className="rounded-xl p-5 space-y-4" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">Docker Storage</p>
            <Link href="/storage" className="flex items-center gap-1 text-xs transition-colors" style={{ color: "#6b6b70" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#6ee7b7")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6b6b70")}
            >
              Details <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {storageLoading ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <Skeleton className="h-40 w-40 rounded-full" style={{ background: "#1a1a1e" }} />
              <div className="grid grid-cols-2 gap-3 w-full">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-4" style={{ background: "#1a1a1e" }} />)}
              </div>
            </div>
          ) : donutData.length > 0 ? (
            <StorageDonut data={donutData} />
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-sm" style={{ color: "#6b6b70" }}>No storage data available</p>
              <p className="text-xs mt-1" style={{ color: "#3a3a40" }}>Docker socket may need additional permissions</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="rounded-xl p-5 space-y-3" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
          <p className="text-sm font-medium text-white">Quick Actions</p>
          <div className="space-y-2">
            <QuickAction
              href="/cleanup" icon={Trash2}
              label="Clean up storage"
              sub={cleanupLoading
                ? "Calculating freeable space..."
                : cleanupPreview && cleanupPreview.totalBytes > 0
                  ? `${formatBytes(cleanupPreview.totalBytes)} can be freed`
                  : "No safe cleanup found"}
            />
            <QuickAction
              href="/storage" icon={HardDrive}
              label="Analyze storage"
              sub="Images, containers, volumes, cache"
            />
            <QuickAction
              href="/logs" icon={ScrollText}
              label="View container logs"
              sub="Real-time streaming logs"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, sub }: {
  href: string; icon: React.ElementType; label: string; sub: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl p-3 transition-all group"
      style={{ border: "1px solid #1c1c20", background: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#1a1a1e"; e.currentTarget.style.borderColor = "#222226"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#1c1c20"; }}
    >
      <div className="rounded-lg p-1.5 shrink-0" style={{ background: "#1a1a1e", border: "1px solid #222226" }}>
        <Icon className="h-4 w-4" style={{ color: "#6b6b70" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: "#f0f0f3" }}>{label}</p>
        <p className="text-xs truncate" style={{ color: "#3a3a40" }}>{sub}</p>
      </div>
      <ArrowRight className="h-3.5 w-3.5 shrink-0" style={{ color: "#3a3a40" }} />
    </Link>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </div>
  );
}
