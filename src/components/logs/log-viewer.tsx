"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowDown, Download, X } from "lucide-react";

interface LogViewerProps {
  containerId: string;
  containerName: string;
}

export function LogViewer({ containerId, containerName }: LogViewerProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [filter, setFilter] = useState("");
  const [connected, setConnected] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    esRef.current?.close();
    setLines([]);
    setConnected(false);

    const es = new EventSource(`/api/containers/${containerId}/logs?tail=300`);
    esRef.current = es;
    es.onopen = () => setConnected(true);
    es.onmessage = (e) => {
      const line: string = JSON.parse(e.data);
      setLines((prev) => [...prev.slice(-2000), line]);
    };
    es.onerror = () => {
      setConnected(false);
      es.close();
    };
  }, [containerId]);

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, [connect]);

  useEffect(() => {
    if (autoScroll) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines, autoScroll]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setAutoScroll(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  }

  function handleDownload() {
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${containerName}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filtered = filter ? lines.filter((l) => l.toLowerCase().includes(filter.toLowerCase())) : lines;

  const btnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    borderRadius: "8px",
    fontSize: "12px",
    background: "#1a1a1e",
    border: "1px solid #222226",
    color: "#6b6b70",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  };

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Filter logs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{
              width: "100%",
              background: "#0d0d0f",
              border: "1px solid #222226",
              borderRadius: "8px",
              padding: "6px 32px 6px 12px",
              fontSize: "13px",
              color: "#f0f0f3",
              outline: "none",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "#3ecf8e")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#222226")}
          />
          {filter && (
            <button
              onClick={() => setFilter("")}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              style={{ color: "#6b6b70" }}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-xs" style={{ color: "#6b6b70" }}>
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: connected ? "#10b981" : "#3a3a40" }}
          />
          {connected ? "live" : "disconnected"}
        </div>

        {!autoScroll && (
          <button
            style={btnStyle}
            onClick={() => {
              setAutoScroll(true);
              bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            <ArrowDown className="h-3.5 w-3.5" />
            Jump to bottom
          </button>
        )}

        <button
          style={btnStyle}
          onClick={handleDownload}
          disabled={lines.length === 0}
        >
          <Download className="h-3.5 w-3.5" />
          Download
        </button>
      </div>

      {/* Log output */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 rounded-xl p-4 font-mono text-xs"
        style={{ background: "#080809", border: "1px solid #1c1c20" }}
      >
        {filtered.length === 0 ? (
          <p className="italic" style={{ color: "#3a3a40" }}>
            {connected ? "Waiting for logs..." : "Connecting..."}
          </p>
        ) : (
          filtered.map((line, i) => <LogLine key={i} line={line} />)
        )}
        <div ref={bottomRef} />
      </div>

      <p className="text-xs shrink-0" style={{ color: "#3a3a40" }}>
        {filtered.length} lines{filter && ` (filtered from ${lines.length})`}
      </p>
    </div>
  );
}

function LogLine({ line }: { line: string }) {
  const isError = /\b(error|err|fatal|panic|exception|failed|failure)\b/i.test(line);
  const isWarn  = /\b(warn|warning)\b/i.test(line);
  return (
    <div
      className="whitespace-pre-wrap break-all leading-5"
      style={{ color: isError ? "#f87171" : isWarn ? "#fbbf24" : "#a0a0a6" }}
    >
      {line}
    </div>
  );
}
