"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, AlertTriangle, Shield, Server, KeyRound, Globe } from "lucide-react";

interface ServerInfo {
  hostname: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  docker: {
    version: string;
    driver: string;
    rootDir: string;
    os: string;
  } | null;
}

export default function SettingsPage() {
  const [info, setInfo] = useState<ServerInfo | null>(null);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/settings/info").then((r) => r.json()).then(setInfo);
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (next !== confirm) { setPwError("Passwords do not match"); return; }
    if (next.length < 8) { setPwError("New password must be at least 8 characters"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error ?? "Failed to update password");
      } else {
        setPwSuccess(true);
        setCurrent(""); setNext(""); setConfirm("");
      }
    } finally {
      setSaving(false);
    }
  }


  const inputStyle = {
    background: "#0d0d0f",
    border: "1px solid #222226",
    color: "#f0f0f3",
    borderRadius: "8px",
    padding: "8px 12px",
    fontSize: "14px",
    width: "100%",
    outline: "none",
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold text-white tracking-tight">Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: "#6b6b70" }}>Account and server configuration</p>
      </div>

      {/* Change Password */}
      <section className="rounded-xl overflow-hidden" style={{ border: "1px solid #1c1c20" }}>
        <div className="flex items-center gap-2.5 px-5 py-4" style={{ background: "#111114", borderBottom: "1px solid #1c1c20" }}>
          <KeyRound className="h-4 w-4" style={{ color: "#3ecf8e" }} />
          <div>
            <p className="text-sm font-medium text-white">Change Password</p>
            <p className="text-xs" style={{ color: "#6b6b70" }}>Update your admin password</p>
          </div>
        </div>
        <div className="p-5" style={{ background: "#0d0d0f" }}>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#6b6b70" }}>Current password</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3ecf8e")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#222226")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#6b6b70" }}>New password</label>
              <input
                type="password"
                placeholder="Min. 8 characters"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3ecf8e")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#222226")}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium" style={{ color: "#6b6b70" }}>Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3ecf8e")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#222226")}
              />
            </div>

            {pwError && (
              <div className="flex items-center gap-2 text-xs" style={{ color: "#f87171" }}>
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center gap-2 text-xs" style={{ color: "#10b981" }}>
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Password updated successfully
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "rgba(62,207,142,0.1)", border: "1px solid rgba(62,207,142,0.2)", color: "#3ecf8e" }}
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Update password
            </button>
          </form>
        </div>
      </section>


      {/* Server Info */}
      <section className="rounded-xl overflow-hidden" style={{ border: "1px solid #1c1c20" }}>
        <div className="flex items-center gap-2.5 px-5 py-4" style={{ background: "#111114", borderBottom: "1px solid #1c1c20" }}>
          <Server className="h-4 w-4" style={{ color: "#3ecf8e" }} />
          <div>
            <p className="text-sm font-medium text-white">Server Info</p>
            <p className="text-xs" style={{ color: "#6b6b70" }}>System and Docker environment details</p>
          </div>
        </div>
        <div style={{ background: "#0d0d0f" }}>
          {!info ? (
            <div className="p-5 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 rounded animate-pulse" style={{ background: "#1a1a1e", width: `${60 + i * 10}%` }} />
              ))}
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#1c1c20" }}>
              <InfoRow label="Hostname" value={info.hostname} />
              <InfoRow label="Platform" value={`${info.platform} (${info.arch})`} />
              <InfoRow label="Node.js" value={info.nodeVersion} />
              {info.docker && (
                <>
                  <InfoRow label="Docker version" value={info.docker.version} />
                  <InfoRow label="Storage driver" value={info.docker.driver} />
                  <InfoRow label="Docker root" value={info.docker.rootDir} mono />
                  <InfoRow label="Host OS" value={info.docker.os} />
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Security Notice */}
      <section className="rounded-xl p-5 space-y-3" style={{ background: "rgba(245,158,11,0.04)", border: "1px solid rgba(245,158,11,0.15)" }}>
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4" style={{ color: "#f59e0b" }} />
          <p className="text-sm font-medium" style={{ color: "#f59e0b" }}>Security</p>
        </div>
        <p className="text-xs" style={{ color: "#a08030" }}>
          DockSurgeon has full access to your Docker socket, which is equivalent to root access on the host.
        </p>
        <ul className="space-y-1.5 text-xs" style={{ color: "#a08030" }}>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
            Keep port 4242 firewalled — do not expose it directly to the internet
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
            Use a reverse proxy with SSL (Caddy or nginx) for external access
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 h-1 w-1 rounded-full shrink-0" style={{ background: "#f59e0b" }} />
            All destructive actions are logged in the audit log
          </li>
        </ul>
      </section>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 gap-4" style={{ borderBottom: "1px solid #1c1c20" }}>
      <span className="text-xs shrink-0" style={{ color: "#6b6b70" }}>{label}</span>
      <span className={`text-xs text-right truncate ${mono ? "font-mono" : ""}`} style={{ color: "#a0a0a6" }}>
        {value}
      </span>
    </div>
  );
}
