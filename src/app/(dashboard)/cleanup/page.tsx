"use client";

import { useState } from "react";
import { Trash2, Image, Box, Database, HardDrive, AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { formatBytes } from "@/lib/utils";
import type { CleanupPreview, CleanupItem } from "@/types/docker";

type CleanupType = "images" | "containers" | "volumes" | "build-cache" | "all";

const CLEANUP_OPTIONS: {
  type: CleanupType;
  label: string;
  description: string;
  icon: React.ElementType;
  risk: "safe" | "verify";
  riskColor: string;
}[] = [
  {
    type: "images",
    label: "Unused Images",
    description: "Remove all images not referenced by any container (running or stopped).",
    icon: Image,
    risk: "safe",
    riskColor: "#10b981",
  },
  {
    type: "containers",
    label: "Stopped Containers",
    description: "Remove all containers that are not currently running.",
    icon: Box,
    risk: "safe",
    riskColor: "#10b981",
  },
  {
    type: "volumes",
    label: "Unused Volumes",
    description: "Remove volumes not mounted by any container. Data will be lost.",
    icon: Database,
    risk: "verify",
    riskColor: "#f59e0b",
  },
  {
    type: "build-cache",
    label: "Build Cache",
    description: "Clear the Docker build cache. Next build will be slower.",
    icon: HardDrive,
    risk: "safe",
    riskColor: "#10b981",
  },
  {
    type: "all",
    label: "Full Prune",
    description: "Run all cleanup operations at once. Volumes included.",
    icon: Trash2,
    risk: "verify",
    riskColor: "#f59e0b",
  },
];

export default function CleanupPage() {
  const [preview, setPreview] = useState<CleanupPreview | null>(null);
  const [activeType, setActiveType] = useState<CleanupType | null>(null);
  const [loadingType, setLoadingType] = useState<CleanupType | null>(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<{ freed: number; done: boolean } | null>(null);

  async function handlePreview(type: CleanupType) {
    setLoadingType(type);
    setResult(null);
    try {
      const res = await fetch("/api/cleanup/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data: CleanupPreview = await res.json();
      setPreview(data);
      setActiveType(type);
    } finally {
      setLoadingType(null);
    }
  }

  async function handleExecute() {
    if (!activeType || !preview) return;
    setExecuting(true);
    setResult(null);
    try {
      const res = await fetch("/api/cleanup/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: activeType }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Cleanup failed");
      }
      
      const data = await res.json();
      setResult({ freed: data.totalFreed ?? preview.totalBytes, done: true });
      setPreview(null);
      setActiveType(null);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Cleanup failed");
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Cleanup</h1>
        <p className="text-sm mt-0.5" style={{ color: "#a1a1aa" }}>
          Preview before deleting — see exactly what disappears and how much space is freed.
        </p>
      </div>

      {result?.done && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981" }}>
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Cleanup complete — freed {formatBytes(result.freed)}.
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CLEANUP_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isLoading = loadingType === opt.type;
          return (
            <div
              key={opt.type}
              className="rounded-xl p-5 flex flex-col gap-4"
              style={{ background: "#111114", border: "1px solid #1c1c20" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#1a1a1e" }}>
                    <Icon className="h-4 w-4" style={{ color: "#d4d4d8" }} />
                  </div>
                  <p className="text-sm font-medium text-white">{opt.label}</p>
                </div>
                <span
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0"
                  style={{
                    background: opt.risk === "verify" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)",
                    color: opt.riskColor,
                    border: `1px solid ${opt.riskColor}33`,
                  }}
                >
                  {opt.risk === "verify" ? "verify" : "safe"}
                </span>
              </div>

              <p className="text-xs flex-1" style={{ color: "#a1a1aa" }}>{opt.description}</p>

              <button
                onClick={() => handlePreview(opt.type)}
                disabled={isLoading || loadingType !== null}
                className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                style={{
                  background: "#1a1a1e",
                  border: "1px solid #222226",
                  color: isLoading || loadingType !== null ? "#52525b" : "#d4d4d8",
                  cursor: isLoading || loadingType !== null ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" />Scanning...</>
                ) : (
                  "Preview cleanup"
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Inline Preview Panel */}
      {preview && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1c1c20" }}>
          {/* Panel header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: "#111114", borderBottom: "1px solid #1c1c20" }}>
            <div className="flex items-center gap-2">
              {preview.riskLevel === "verify" && <AlertTriangle className="h-4 w-4" style={{ color: "#f59e0b" }} />}
              <span className="text-sm font-medium text-white">Cleanup Preview</span>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#1a1a1e", color: "#a1a1aa" }}>
                {preview.items.length} items
              </span>
            </div>
            <button onClick={() => setPreview(null)} style={{ color: "#a1a1aa" }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Warnings */}
          {preview.warnings.length > 0 && (
            <div className="px-5 py-3 space-y-1.5" style={{ background: "rgba(245,158,11,0.06)", borderBottom: "1px solid rgba(245,158,11,0.15)" }}>
              {preview.warnings.map((w, i) => (
                <p key={i} className="flex items-start gap-2 text-xs" style={{ color: "#f59e0b" }}>
                  <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  {w}
                </p>
              ))}
            </div>
          )}

          {/* Items */}
          <div style={{ background: "#0d0d0f", maxHeight: "280px", overflowY: "auto" }}>
            {preview.items.length === 0 ? (
              <p className="px-5 py-8 text-sm text-center" style={{ color: "#a1a1aa" }}>Nothing to clean up.</p>
            ) : (
              preview.items.map((item: CleanupItem, i) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between px-5 py-2.5 text-sm"
                  style={{ borderBottom: i < preview.items.length - 1 ? "1px solid #1c1c20" : "none" }}
                >
                  <div className="min-w-0">
                    <p className="font-mono text-xs truncate" style={{ color: "#d4d4d8" }}>{item.name}</p>
                    <p className="text-[10px] capitalize" style={{ color: "#71717a" }}>{item.type}</p>
                  </div>
                  <span className="text-xs tabular-nums ml-4 shrink-0" style={{ color: "#a1a1aa" }}>
                    {item.bytes > 0 ? formatBytes(item.bytes) : "—"}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: "#111114", borderTop: "1px solid #1c1c20" }}>
            <div>
              <span className="text-xs" style={{ color: "#a1a1aa" }}>Total space freed: </span>
              <span className="text-sm font-mono font-medium" style={{ color: preview.totalBytes > 0 ? "#10b981" : "#71717a" }}>
                {formatBytes(preview.totalBytes)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreview(null)}
                disabled={executing}
                className="px-3 py-1.5 rounded-lg text-sm transition-colors"
                style={{ background: "#1a1a1e", border: "1px solid #222226", color: "#a1a1aa" }}
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={executing || preview.items.length === 0}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                style={{
                  background: preview.items.length === 0 ? "#1a1a1e" : "rgba(239,68,68,0.15)",
                  border: `1px solid ${preview.items.length === 0 ? "#222226" : "rgba(239,68,68,0.3)"}`,
                  color: preview.items.length === 0 ? "#71717a" : "#f87171",
                  cursor: preview.items.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {executing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {executing ? "Cleaning..." : `Delete ${preview.items.length} items`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
