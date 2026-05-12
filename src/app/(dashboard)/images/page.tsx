"use client";

import { useEffect, useState } from "react";
import { Trash2, Loader2, AlertTriangle, RefreshCw, X } from "lucide-react";
import { formatBytes } from "@/lib/utils";

interface DockerImage {
  id: string;
  shortId: string;
  tags: string[];
  size: number;
  created: number;
  inUse: boolean;
  containers: number;
}

export default function ImagesPage() {
  const [images, setImages] = useState<DockerImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<DockerImage | null>(null);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    fetch("/api/images")
      .then((r) => r.json())
      .then((data) => setImages(data.sort((a: DockerImage, b: DockerImage) => b.size - a.size)))
      .catch(() => setError("Failed to load images"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(img: DockerImage) {
    setDeleting(img.id);
    setError("");
    try {
      const res = await fetch(`/api/images/${encodeURIComponent(img.id)}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Delete failed");
      } else {
        setImages((prev) => prev.filter((i) => i.id !== img.id));
      }
    } finally {
      setDeleting(null);
      setConfirm(null);
    }
  }

  const totalSize = images.reduce((s, i) => s + i.size, 0);
  const unused = images.filter((i) => !i.inUse).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight">Images</h1>
          <p className="text-sm mt-0.5" style={{ color: "#a1a1aa" }}>
            {loading ? "Loading..." : `${images.length} images · ${formatBytes(totalSize)} total · ${unused} unused`}
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

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #1c1c20" }}>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#111114", borderBottom: "1px solid #1c1c20" }}>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Size</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Created</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider" style={{ color: "#71717a" }}>Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody style={{ background: "#0d0d0f" }}>
            {loading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1c1c20" }}>
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded animate-pulse" style={{ background: "#1a1a1e", width: j === 5 ? "32px" : "80%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : images.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm" style={{ color: "#a1a1aa" }}>
                  No images found
                </td>
              </tr>
            ) : (
              images.map((img, i) => (
                <tr
                  key={img.id}
                  style={{ borderBottom: i < images.length - 1 ? "1px solid #1c1c20" : "none" }}
                  className="transition-colors"
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#111114")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td className="px-4 py-3 max-w-[200px]">
                    <p className="font-mono text-xs truncate" style={{ color: img.tags[0] ? "#f0f0f3" : "#71717a" }}>
                      {img.tags[0] ?? "<none>"}
                    </p>
                    {img.tags.length > 1 && (
                      <p className="text-[10px]" style={{ color: "#71717a" }}>+{img.tags.length - 1} more</p>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "#a1a1aa" }}>{img.shortId}</td>
                  <td className="px-4 py-3 text-xs tabular-nums" style={{ color: "#d4d4d8" }}>{formatBytes(img.size)}</td>
                  <td className="px-4 py-3 text-xs" style={{ color: "#a1a1aa" }}>
                    {new Date(img.created * 1000).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {img.inUse ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                        in use
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "#1a1a1e", color: "#a1a1aa", border: "1px solid #222226" }}>
                        unused
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      disabled={img.inUse || deleting === img.id}
                      onClick={() => setConfirm(img)}
                      title={img.inUse ? "Cannot remove image in use" : "Remove image"}
                      className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors"
                      style={{
                        background: "transparent",
                        color: img.inUse || deleting === img.id ? "#71717a" : "#a1a1aa",
                        cursor: img.inUse ? "not-allowed" : "pointer",
                      }}
                      onMouseEnter={(e) => { if (!img.inUse) e.currentTarget.style.color = "#f87171"; }}
                      onMouseLeave={(e) => { if (!img.inUse) e.currentTarget.style.color = "#a1a1aa"; }}
                    >
                      {deleting === img.id
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
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
                <h3 className="text-sm font-medium text-white">Remove image?</h3>
              </div>
              <button onClick={() => setConfirm(null)} style={{ color: "#a1a1aa" }}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-sm" style={{ color: "#a1a1aa" }}>
              <span className="font-mono" style={{ color: "#d4d4d8" }}>{confirm.tags[0] ?? confirm.shortId}</span>
              {" "}({formatBytes(confirm.size)}) will be permanently deleted.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 py-2 rounded-lg text-sm transition-colors"
                style={{ background: "#1a1a1e", border: "1px solid #222226", color: "#d4d4d8" }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirm)}
                disabled={!!deleting}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors"
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
