"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

const GREEN = "#3ecf8e";

export default function SetupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    const res = await fetch("/api/setup/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Setup failed");
    } else {
      router.push("/login");
    }
  }

  return (
    <div style={pageStyle}>
      <BrandHeader />

      <div style={cardStyle}>
        <h2 style={{ fontSize: "16px", fontWeight: 600, color: "#ffffff", marginBottom: "4px" }}>Create admin account</h2>
        <p style={{ fontSize: "13px", color: "#525252", marginBottom: "24px" }}>First-time setup — set this up once.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <Field label="Email address">
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required autoFocus
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#383838")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              placeholder="Min. 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#383838")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
            />
          </Field>
          <Field label="Confirm password">
            <input
              type="password"
              placeholder="Repeat password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#383838")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#222222")}
            />
          </Field>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", padding: "10px 12px", fontSize: "12px", color: "#f87171" }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", background: GREEN, color: "#0a1a12", border: "none", borderRadius: "8px", padding: "10px 16px", fontSize: "13px", fontWeight: 600, marginTop: "4px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading && <SpinnerCss color="#0a1a12" size={13} />}
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>

      <div style={{ marginTop: "16px", width: "100%", maxWidth: "360px", display: "flex", alignItems: "flex-start", gap: "8px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.12)", borderRadius: "8px", padding: "10px 12px" }}>
        <Shield style={{ height: "13px", width: "13px", color: "#92400e", marginTop: "1px", flexShrink: 0 }} />
        <p style={{ fontSize: "11px", color: "#78350f", lineHeight: 1.5 }}>
          Docker socket access = root equivalent. Keep port 4242 firewalled.
        </p>
      </div>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  background: "#0a0a0a",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  backgroundImage: "radial-gradient(circle at 1px 1px, #181818 1px, transparent 0)",
  backgroundSize: "28px 28px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "360px",
  background: "#111111",
  border: "1px solid #1f1f1f",
  borderRadius: "12px",
  padding: "24px",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 8px 40px rgba(0,0,0,0.4)",
};

const inputStyle: React.CSSProperties = {
  background: "#0d0d0d",
  border: "1px solid #222222",
  borderRadius: "8px",
  padding: "9px 12px",
  fontSize: "13px",
  color: "#e5e5e5",
  outline: "none",
  transition: "border-color 0.15s",
  width: "100%",
  boxSizing: "border-box",
};

function BrandHeader() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "32px" }}>
      <div style={{ height: "28px", width: "28px", borderRadius: "6px", background: "rgba(62,207,142,0.1)", border: "1px solid rgba(62,207,142,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
          <rect x="3" y="6" width="22" height="16" rx="3" fill="#0a2a1a" stroke="#1a6040" strokeWidth="1" />
          <rect x="12.5" y="10" width="3" height="8" rx="1" fill={GREEN} />
          <rect x="10" y="12.5" width="8" height="3" rx="1" fill={GREEN} />
          <circle cx="23" cy="7" r="2.5" fill={GREEN} />
          <circle cx="23" cy="7" r="1.2" fill="#0a0a0a" />
        </svg>
      </div>
      <span style={{ fontSize: "15px", fontWeight: 600, color: "#ffffff", letterSpacing: "-0.01em" }}>DockSurgeon</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <label style={{ fontSize: "12px", fontWeight: 500, color: "#737373" }}>{label}</label>
      {children}
    </div>
  );
}

function SpinnerCss({ color = "#ffffff", size = 20 }: { color?: string; size?: number }) {
  return (
    <>
      <style>{`@keyframes ds-spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ height: size, width: size, borderRadius: "50%", border: `2px solid ${color}30`, borderTopColor: color, animation: "ds-spin 0.7s linear infinite", flexShrink: 0 }} />
    </>
  );
}
