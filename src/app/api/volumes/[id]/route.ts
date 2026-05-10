import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";
import db from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  try {
    const volume = docker.getVolume(id);
    await volume.remove();

    db.prepare(
      "INSERT INTO audit_log (action, target_id, target_name, success) VALUES (?, ?, ?, 1)"
    ).run("remove_volume", id, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
