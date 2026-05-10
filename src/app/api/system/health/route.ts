import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";
import { getDiskUsage, getUptime, getMemoryUsage } from "@/lib/system";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [diskUsage, uptime, memory, dockerInfo] = await Promise.allSettled([
    Promise.resolve(getDiskUsage()),
    Promise.resolve(getUptime()),
    Promise.resolve(getMemoryUsage()),
    docker.info(),
  ]);

  return NextResponse.json({
    disk: diskUsage.status === "fulfilled" ? diskUsage.value : [],
    uptime: uptime.status === "fulfilled" ? uptime.value : 0,
    memory: memory.status === "fulfilled" ? memory.value : null,
    docker: dockerInfo.status === "fulfilled" ? {
      containers: dockerInfo.value.Containers,
      images: dockerInfo.value.Images,
      version: dockerInfo.value.ServerVersion,
      driver: dockerInfo.value.Driver,
    } : null,
  });
}
