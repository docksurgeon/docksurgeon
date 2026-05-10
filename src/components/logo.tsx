

export function Logo({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <img
      src="/logo/logo-with-name.png"
      alt="DockSurgeon"
      className={className}
      style={{ height: size, width: "auto", objectFit: "contain", display: "block" }}
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={`flex flex-col items-start ${className ?? ""}`}>
      <Logo size={40} />
      <span className="text-[10px] mt-1 ml-1.5 font-semibold opacity-40 uppercase tracking-widest" style={{ color: "#ffffff" }}>v1.0.0</span>
    </div>
  );
}
