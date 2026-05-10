import Image from "next/image";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Image
      src="/logo/logo-with-name.png"
      alt="DockSurgeon"
      width={size * 4}
      height={size}
      style={{ objectFit: "contain", width: "auto" }}
      priority
      unoptimized
    />
  );
}

export function LogoMark({ className }: { className?: string }) {
  return (
    <div className={`flex items-center ${className ?? ""}`}>
      <Logo size={40} />
      <span className="text-[10px] ml-2 mt-4" style={{ color: "#3a3a40" }}>v1.0.0</span>
    </div>
  );
}
