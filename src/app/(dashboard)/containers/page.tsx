"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ScrollText, Loader2, AlertTriangle, RefreshCw, X } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  sizeRw: number;
  sizeRootFs: number;
}

const stateStyle = (state: string): { color: string; bg: string; border: string } => {
  if (state === "running") return { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)" };
  if (state === "paused")  return { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)" };
  return { color: "#6b6b70", bg: "#1a1a1e", border: "#222226" };
};

export default function ContainersPage() {
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Container | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/containers")
      .then((r) => r.json())
      .then(setContainers)
      .catch(() => setError("Failed to load containers"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(c: Container) {
    setDeleting(c.id);
    setError("");
    try {
      const res = await fetch(`/api/containers/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Delete failed");
      } else {
        setContainers((prev) => prev.filter((x) => x.id !== c.id));
      }
    } finally {
      setDeleting(null);
      setConfirm(null);
    }
  }

  const running = containers.filter((c) => c.state === "running").length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Containers</h1>
          <p className="text-sm mt-0.5" style={{ color: "#6b6b70" }}>
            {loading ? "Loading..." : `${containers.length} total · ${running} running`}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors"
          style={{ background: "#1a1a1e", border: "1px solid #222226", color: "#a0a0a6" }}
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

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1c1c20" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#111114", borderBottom: "1px solid #1c1c20" }}>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#3a3a40" }}>Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#3a3a40" }}>Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#3a3a40" }}>State</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#3a3a40" }}>Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#3a3a40" }}>Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody style={{ background: "#0d0d0f" }}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1c1c20" }}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded animate-pulse" style={{ background: "#1a1a1e", width: j === 5 ? "48px" : "75%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : containers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "#6b6b70" }}>
                  No containers found
                </td>
              </tr>
            ) : (
              containers.map((c, i) => {
                const s = stateStyle(c.state);
                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: i < containers.length - 1 ? "1px solid #1c1c20" : "none" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#111114")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    className="transition-colors"
                  >
                    <td className="px-4 py-3 text-sm font-medium" style={{ color: "#f0f0f3" }}>{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs max-w-[180px]" style={{ color: "#6b6b70" }}>
                      <span className="truncate block">{c.image}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
                      >
                        {c.state}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "#a0a0a6" }}>
                      {c.sizeRootFs > 0 ? formatBytes(c.sizeRootFs) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "#6b6b70" }}>
                      {new Date(c.created * 1000).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          title="View logs"
                          onClick={() => router.push(`/logs?container=${c.id}`)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: "#6b6b70" }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#a0a0a6")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "#6b6b70")}
                        >
                          <ScrollText className="h-3.5 w-3.5" />
                        </button>
                        <button
                          disabled={c.state === "running" || deleting === c.id}
                          title={c.state === "running" ? "Stop container first" : "Remove container"}
                          onClick={() => setConfirm(c)}
                          className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            color: c.state === "running" ? "#3a3a40" : "#6b6b70",
                            cursor: c.state === "running" ? "not-allowed" : "pointer",
                          }}
                          onMouseEnter={(e) => { if (c.state !== "running") e.currentTarget.style.color = "#f87171"; }}
                          onMouseLeave={(e) => { if (c.state !== "running") e.currentTarget.style.color = "#6b6b70"; }}
                        >
                          {deleting === c.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm modal */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 space-y-4" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-medium text-white">Remove container?</h3>
              <button onClick={() => setConfirm(null)} style={{ color: "#6b6b70" }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm" style={{ color: "#6b6b70" }}>
              Container <span style={{ color: "#a0a0a6" }}>{confirm.name}</span> will be permanently removed.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ background: "#1a1a1e", border: "1px solid #222226", color: "#a0a0a6" }}
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
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
