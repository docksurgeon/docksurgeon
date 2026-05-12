import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";
import type { CleanupPreview, CleanupItem } from "@/types/docker";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await req.json();
  const items: CleanupItem[] = [];
  const warnings: string[] = [];

  const [images, containers, volumes] = await Promise.all([
    docker.listImages({ all: false }),
    docker.listContainers({ all: true, size: true }),
    docker.listVolumes(),
  ]);
  type ContainerInfoExtended = (typeof containers)[0] & { SizeRw?: number; SizeRootFs?: number };

  // All container image IDs (running + stopped)
  const allContainerImageIds = new Set(containers.map((c) => c.ImageID));
  const runningContainerIds = new Set(
    containers.filter((c) => c.State === "running").map((c) => c.Id)
  );
  const usedVolumeNames = new Set(
    containers.flatMap((c) => c.Mounts?.map((m) => m.Name ?? "") ?? [])
  );

  if (type === "images" || type === "all") {
    // All images not referenced by ANY container (running or stopped)
    const unused = images.filter((img) => !allContainerImageIds.has(img.Id));
    for (const img of unused) {
      items.push({
        id: img.Id,
        name: img.RepoTags?.[0] ?? img.Id.slice(7, 19),
        type: "image",
        bytes: img.Size,
        riskLevel: "safe",
      });
    }
  }

  if (type === "containers" || type === "all") {
    const stopped = (containers as ContainerInfoExtended[]).filter((c) => !runningContainerIds.has(c.Id));
    for (const c of stopped) {
      items.push({
        id: c.Id,
        name: c.Names?.[0]?.replace("/", "") ?? c.Id.slice(0, 12),
        type: "container",
        bytes: c.SizeRootFs ?? c.SizeRw ?? 0,
        riskLevel: "safe",
      });
    }
  }

  if (type === "volumes" || type === "all") {
    const unused = (volumes.Volumes ?? []).filter((v) => !usedVolumeNames.has(v.Name));
    for (const v of unused) {
      items.push({
        id: v.Name,
        name: v.Name,
        type: "volume",
        bytes: (v as any).UsageData?.Size ?? 0,
        riskLevel: "verify",
        warning: "Volume data will be permanently deleted",
      });
      warnings.push(`Volume "${v.Name}" data will be permanently deleted`);
    }
  }

  if (type === "build-cache" || type === "all") {
    try {
      const dfData = await docker.df();
      const cache = (dfData.BuildCache ?? []) as { ID: string; Size: number; InUse: boolean }[];
      const unusedCache = cache.filter((c) => !c.InUse);
      const totalCacheSize = unusedCache.reduce((s, c) => s + c.Size, 0);
      if (totalCacheSize > 0) {
        items.push({
          id: "build-cache",
          name: `Build cache (${unusedCache.length} entries)`,
          type: "build-cache",
          bytes: totalCacheSize,
          riskLevel: "safe",
        });
      }
    } catch { /* df may not be available */ }
  }

  const totalBytes = items.reduce((sum, i) => sum + i.bytes, 0);
  const hasVerify = items.some((i) => i.riskLevel === "verify");

  const preview: CleanupPreview = {
    items,
    totalBytes,
    riskLevel: hasVerify ? "verify" : "safe",
    warnings,
  };

  return NextResponse.json(preview);
}
