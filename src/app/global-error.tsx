"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ background: "#0a0a0a", margin: 0, fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center", color: "#f87171" }}>
          <p style={{ fontSize: "14px", marginBottom: "12px" }}>Something went wrong.</p>
          <button
            onClick={reset}
            style={{ fontSize: "13px", padding: "8px 16px", borderRadius: "8px", background: "#1a1a1e", border: "1px solid #222226", color: "#a0a0a6", cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
