import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type } = await req.json();
  const results: { action: string; success: boolean; freed?: number; error?: string }[] = [];

  try {
    if (type === "images" || type === "all") {
      // dangling: false = remove ALL unused images, not just dangling
      const pruned = await docker.pruneImages({ filters: { dangling: ["false"] } });
      const freed = pruned.SpaceReclaimed ?? 0;
      db.prepare("INSERT INTO audit_log (action, bytes_freed, success) VALUES (?, ?, 1)").run("prune_images", freed);
      results.push({ action: "prune_images", success: true, freed });
    }

    if (type === "containers" || type === "all") {
      await docker.pruneContainers();
      db.prepare("INSERT INTO audit_log (action, bytes_freed, success) VALUES (?, ?, 1)").run("prune_containers", 0);
      results.push({ action: "prune_containers", success: true });
    }

    if (type === "volumes" || type === "all") {
      const [volumes, containers] = await Promise.all([
        docker.listVolumes(),
        docker.listContainers({ all: true }),
      ]);
      const usedVolumeNames = new Set(
        containers.flatMap((c) => c.Mounts?.map((m) => m.Name ?? "") ?? [])
      );
      const unused = (volumes.Volumes ?? []).filter((v) => !usedVolumeNames.has(v.Name));
      
      let freed = 0;
      for (const v of unused) {
        try {
          const vol = docker.getVolume(v.Name);
          await vol.remove();
          // Note: v.UsageData might be undefined if not returned by listVolumes
          freed += (v as any).UsageData?.Size ?? 0;
          db.prepare("INSERT INTO audit_log (action, target_id, target_name, success) VALUES (?, ?, ?, 1)")
            .run("remove_volume", v.Name, v.Name);
        } catch (err) {
          console.error(`Failed to remove volume ${v.Name}:`, err);
        }
      }
      results.push({ action: "prune_volumes", success: true, freed });
    }

    if (type === "build-cache" || type === "all") {
      const pruned = await docker.pruneBuilder();
      const freed = (pruned as any).SpaceReclaimed ?? 0;
      db.prepare("INSERT INTO audit_log (action, bytes_freed, success) VALUES (?, ?, 1)").run("prune_build_cache", freed);
      results.push({ action: "prune_build_cache", success: true, freed });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    db.prepare("INSERT INTO audit_log (action, success, error) VALUES (?, 0, ?)").run(type, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const totalFreed = results.reduce((s, r) => s + (r.freed ?? 0), 0);
  return NextResponse.json({ results, totalFreed });
}
