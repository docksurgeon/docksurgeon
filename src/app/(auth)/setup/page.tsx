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
              onFocus={(e) => {
                e.currentTarget.style.borderColor = GREEN;
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(62, 207, 142, 0.15)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#222222";
                e.currentTarget.style.boxShadow = "none";
              }}
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
              onFocus={(e) => {
                e.currentTarget.style.borderColor = GREEN;
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(62, 207, 142, 0.15)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#222222";
                e.currentTarget.style.boxShadow = "none";
              }}
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
              onFocus={(e) => {
                e.currentTarget.style.borderColor = GREEN;
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(62, 207, 142, 0.15)`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#222222";
                e.currentTarget.style.boxShadow = "none";
              }}
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
            className="hover:opacity-90 active:scale-[0.98] transition-all duration-200"
            style={{ 
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", 
              width: "100%", 
              background: "linear-gradient(135deg, #3ecf8e 0%, #2bb87a 100%)", 
              boxShadow: "inset 0 1px 1px rgba(255, 255, 255, 0.2), 0 2px 8px rgba(62, 207, 142, 0.2)",
              color: "#0a1a12", border: "none", borderRadius: "8px", padding: "10px 16px", 
              fontSize: "13px", fontWeight: 600, marginTop: "8px", 
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 
            }}
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
  background: "rgba(17, 17, 17, 0.6)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "16px",
  padding: "32px 28px",
  boxShadow: "0 0 0 1px rgba(0,0,0,0.3), 0 12px 48px rgba(0,0,0,0.5)",
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "32px" }}>
      <img
        src="/logo/logo-with-name.png"
        alt="DockSurgeon"
        style={{ height: "36px", width: "auto", objectFit: "contain" }}
      />
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
