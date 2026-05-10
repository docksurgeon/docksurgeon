export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#0d0d0f" }}>
      {children}
    </div>
  );
}
