import { Sidebar } from "@/components/layout/sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#0d0d0f" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto" style={{ background: "#0d0d0f" }}>
        {children}
      </main>
    </div>
  );
}
