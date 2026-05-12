"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2, AlertTriangle, RefreshCw, X } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface Volume {
  name: string;
  driver: string;
  mountpoint: string;
  created: string;
  size: number;
  inUse: boolean;
}

export default function VolumesPage() {
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Volume | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/volumes")
      .then((r) => r.json())
      .then(setVolumes)
      .catch(() => setError("Failed to load volumes"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(v: Volume) {
    setDeleting(v.name);
    setError("");
    try {
      const res = await fetch(`/api/volumes/${encodeURIComponent(v.name)}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Delete failed");
      } else {
        setVolumes((prev) => prev.filter((x) => x.name !== v.name));
      }
    } finally {
      setDeleting(null);
      setConfirm(null);
    }
  }

  const unused = volumes.filter((v) => !v.inUse).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Volumes</h1>
          <p className="text-sm mt-0.5" style={{ color: "#a1a1aa" }}>
            {loading ? "Loading..." : `${volumes.length} total · ${unused} unused`}
          </p>
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

      {error && (
        <div className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!loading && unused > 0 && (
        <div className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)", color: "#f59e0b" }}>
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {unused} unused volume{unused > 1 ? "s" : ""} — verify before deleting, data cannot be recovered.
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1c1c20" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#111114", borderBottom: "1px solid #1c1c20" }}>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Driver</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody style={{ background: "#0d0d0f" }}>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1c1c20" }}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded animate-pulse" style={{ background: "#1a1a1e", width: j === 5 ? "32px" : "70%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : volumes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "#a1a1aa" }}>
                  No volumes found
                </td>
              </tr>
            ) : (
              volumes.map((v, i) => (
                <tr
                  key={v.name}
                  style={{ borderBottom: i < volumes.length - 1 ? "1px solid #1c1c20" : "none" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#111114")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  className="transition-colors"
                >
                  <td className="px-4 py-3 font-mono text-xs max-w-[200px]">
                    <span className="truncate block" style={{ color: "#d4d4d8" }}>{v.name}</span>
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#a1a1aa" }}>{v.driver}</td>
                  <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "#d4d4d8" }}>
                    {v.size >= 0 ? formatBytes(v.size) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {v.inUse ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                        in use
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                        unused
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#a1a1aa" }}>
                    {v.created ? new Date(v.created).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      <button
                        disabled={v.inUse || deleting === v.name}
                        title={v.inUse ? "Volume is in use" : "Remove volume"}
                        onClick={() => setConfirm(v)}
                        className="h-7 w-7 rounded-lg flex items-center justify-center"
                        style={{
                          color: v.inUse ? "#71717a" : "#a1a1aa",
                          cursor: v.inUse ? "not-allowed" : "pointer",
                        }}
                        onMouseEnter={(e) => { if (!v.inUse) e.currentTarget.style.color = "#f87171"; }}
                        onMouseLeave={(e) => { if (!v.inUse) e.currentTarget.style.color = "#a1a1aa"; }}
                      >
                        {deleting === v.name
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#f59e0b" }} />
                <h3 className="text-sm font-medium text-white">Delete volume?</h3>
              </div>
              <button onClick={() => setConfirm(null)} style={{ color: "#a1a1aa" }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm" style={{ color: "#a1a1aa" }}>
              Volume <span className="font-mono" style={{ color: "#d4d4d8" }}>{confirm.name}</span> and all its data will be permanently deleted. This cannot be undone.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ background: "#1a1a1e", border: "1px solid #222226", color: "#d4d4d8" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirm)}
                disabled={!!deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
                style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}
              >
                {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
