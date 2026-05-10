import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [images, containers, volumes, diskUsage] = await Promise.allSettled([
    docker.listImages({ all: true }),
    docker.listContainers({ all: true, size: true }),
    docker.listVolumes(),
    docker.df(),
  ]);

  return NextResponse.json({
    images: images.status === "fulfilled" ? images.value : [],
    containers: containers.status === "fulfilled" ? containers.value : [],
    volumes: volumes.status === "fulfilled" ? volumes.value.Volumes : [],
    df: diskUsage.status === "fulfilled" ? diskUsage.value : null,
  });
}
