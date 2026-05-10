import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";
import os from "os";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [dockerInfo] = await Promise.allSettled([docker.info()]);

  return NextResponse.json({
    hostname: os.hostname(),
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    docker:
      dockerInfo.status === "fulfilled"
        ? {
            version: dockerInfo.value.ServerVersion,
            driver: dockerInfo.value.Driver,
            rootDir: dockerInfo.value.DockerRootDir,
            os: dockerInfo.value.OperatingSystem,
          }
        : null,
  });
}
