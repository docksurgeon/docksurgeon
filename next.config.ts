import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["dockerode", "ssh2", "cpu-features", "better-sqlite3", "next-auth", "@auth/core"],
  experimental: {
    serverActions: {
      allowedOrigins: ["localhost:4242"],
    },
  },
};

export default nextConfig;
