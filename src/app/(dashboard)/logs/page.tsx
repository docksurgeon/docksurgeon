"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LogViewer } from "@/components/logs/log-viewer";

interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
}

export default function LogsPage() {
  return (
    <Suspense>
      <LogsContent />
    </Suspense>
  );
}

function LogsContent() {
  const searchParams = useSearchParams();
  const [containers, setContainers] = useState<Container[]>([]);
  const [selected, setSelected] = useState<Container | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/containers")
      .then((r) => r.json())
      .then((data: Container[]) => {
        setContainers(data);
        const paramId = searchParams.get("container");
        if (paramId) {
          const match = data.find((c) => c.id === paramId);
          if (match) { setSelected(match); return; }
        }
        const running = data.find((c) => c.state === "running");
        if (running) setSelected(running);
      })
      .finally(() => setLoading(false));
  }, [searchParams]);

  return (
    <div className="flex flex-col p-6 gap-4" style={{ height: "100vh" }}>
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Logs</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6b6b70" }}>Real-time streaming container logs</p>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Container list */}
        <div className="w-56 shrink-0 flex flex-col gap-1 overflow-y-auto">
          {loading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "#111114", border: "1px solid #1c1c20" }} />
            ))
          ) : containers.length === 0 ? (
            <p className="text-sm px-1" style={{ color: "#6b6b70" }}>No containers found</p>
          ) : (
            containers.map((c) => {
              const active = selected?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c)}
                  className="w-full rounded-xl p-3 text-left transition-colors"
                  style={{
                    background: active ? "rgba(62,207,142,0.08)" : "#111114",
                    border: active ? "1px solid rgba(62,207,142,0.18)" : "1px solid #1c1c20",
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: c.state === "running" ? "#10b981" : "#3a3a40" }}
                    />
                    <span className="font-medium text-xs truncate" style={{ color: active ? "#6ee7b7" : "#a0a0a6" }}>{c.name}</span>
                  </div>
                  <p className="truncate text-[10px] pl-3.5" style={{ color: "#3a3a40" }}>{c.image}</p>
                </button>
              );
            })
          )}
        </div>

        {/* Log viewer area */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col gap-3">
          {selected ? (
            <>
              {/* Container label bar */}
              <div className="flex items-center gap-2.5 shrink-0 px-4 py-2.5 rounded-xl" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: selected.state === "running" ? "#10b981" : "#3a3a40" }}
                />
                <span className="text-sm font-medium" style={{ color: "#f0f0f3" }}>{selected.name}</span>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{
                    background: selected.state === "running" ? "rgba(16,185,129,0.1)" : "#1a1a1e",
                    color: selected.state === "running" ? "#10b981" : "#6b6b70",
                    border: `1px solid ${selected.state === "running" ? "rgba(16,185,129,0.2)" : "#222226"}`,
                  }}
                >
                  {selected.state}
                </span>
                <span className="text-xs truncate ml-1" style={{ color: "#3a3a40" }}>{selected.image}</span>
              </div>
              <div className="flex-1 min-h-0">
                <LogViewer containerId={selected.id} containerName={selected.name} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center rounded-xl" style={{ background: "#111114", border: "1px solid #1c1c20" }}>
              <p className="text-sm" style={{ color: "#3a3a40" }}>Select a container to view logs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
