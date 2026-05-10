

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/logo/logo-with-name.png"
      alt="DockSurgeon"
      style={{ height: size, width: "auto", objectFit: "contain" }}
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start ${className ?? ""}`}>
      <Logo size={28} />
      <span className="text-[10px] mt-1 ml-1" style={{ color: "#737373", letterSpacing: "0.02em" }}>v1.0.0</span>
    </div>
  );
}
