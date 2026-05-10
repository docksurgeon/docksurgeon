"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard, HardDrive, Trash2, Image,
  Box, Database, ScrollText, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/logo";

const nav = [
  { href: "/overview",   label: "Overview",   icon: LayoutDashboard },
  { href: "/storage",    label: "Storage",    icon: HardDrive },
  { href: "/cleanup",    label: "Cleanup",    icon: Trash2 },
  { href: "/images",     label: "Images",     icon: Image },
  { href: "/containers", label: "Containers", icon: Box },
  { href: "/volumes",    label: "Volumes",    icon: Database },
  { href: "/logs",       label: "Logs",       icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-52 shrink-0 flex-col" style={{ background: "#0a0a0c", borderRight: "1px solid #1c1c20" }}>
      {/* Logo */}
      <div className="h-14 flex items-center px-4" style={{ borderBottom: "1px solid #1c1c20" }}>
        <LogoMark />
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        <p className="px-3 pt-2 pb-1 text-[10px] font-medium uppercase tracking-widest" style={{ color: "#3a3a40" }}>
          Navigation
        </p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150",
                active
                  ? "text-emerald-400"
                  : "hover:text-zinc-100 transition-colors"
              )}
              style={active
                ? { background: "rgba(62,207,142,0.08)", border: "1px solid rgba(62,207,142,0.18)" }
                : { color: "#6b6b70", border: "1px solid transparent" }
              }
            >
              <Icon className="h-[15px] w-[15px] shrink-0" />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-2 space-y-0.5" style={{ borderTop: "1px solid #1c1c20" }}>
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
            pathname === "/settings" ? "text-emerald-300" : "hover:text-zinc-100"
          )}
          style={pathname === "/settings"
            ? { background: "rgba(62,207,142,0.08)", border: "1px solid rgba(62,207,142,0.18)", color: "#6ee7b7" }
            : { color: "#6b6b70", border: "1px solid transparent" }
          }
        >
          <Settings className="h-[15px] w-[15px]" />
          <span className="font-medium">Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all hover:text-red-400"
          style={{ color: "#6b6b70", border: "1px solid transparent" }}
        >
          <LogOut className="h-[15px] w-[15px]" />
          <span className="font-medium">Sign out</span>
        </button>
      </div>
    </aside>
  );
}
