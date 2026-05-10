import Image from "next/image";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo/logo.png"
      alt="DockSurgeon"
      width={size}
      height={size}
      style={{ objectFit: "contain" }}
      priority
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <div
        className="relative flex items-center justify-center h-8 w-8 rounded-lg shrink-0"
        style={{ background: "rgba(62,207,142,0.08)", border: "1px solid rgba(62,207,142,0.2)" }}
      >
        <Logo size={24} />
      </div>
      <div>
        <p className="text-sm font-semibold text-white leading-none tracking-tight">
          DockSurgeon
        </p>
        <p className="text-[10px] mt-0.5 leading-none" style={{ color: "#3a3a40" }}>v1.0.0</p>
      </div>
    </div>
  );
}
