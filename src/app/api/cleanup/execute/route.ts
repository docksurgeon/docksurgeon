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
      const pruned = await docker.pruneVolumes();
      const freed = pruned.SpaceReclaimed ?? 0;
      db.prepare("INSERT INTO audit_log (action, bytes_freed, success) VALUES (?, ?, 1)").run("prune_volumes", freed);
      results.push({ action: "prune_volumes", success: true, freed });
    }

    if (type === "build-cache" || type === "all") {
      const pruned = await docker.pruneBuilder();
      const freed = (pruned as { SpaceReclaimed?: number }).SpaceReclaimed ?? 0;
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
