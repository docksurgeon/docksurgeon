import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [{ Volumes }, containers] = await Promise.all([
    docker.listVolumes(),
    docker.listContainers({ all: true }),
  ]);

  const usedVolumeNames = new Set(
    containers.flatMap((c) => c.Mounts?.map((m) => m.Name ?? "") ?? [])
  );

  return NextResponse.json(
    (Volumes ?? []).map((v) => ({
      name: v.Name,
      driver: v.Driver,
      mountpoint: v.Mountpoint,
      created: (v as typeof v & { CreatedAt?: string }).CreatedAt ?? null,
      size: v.UsageData?.Size ?? -1,
      refCount: v.UsageData?.RefCount ?? 0,
      inUse: usedVolumeNames.has(v.Name),
    }))
  );
}
