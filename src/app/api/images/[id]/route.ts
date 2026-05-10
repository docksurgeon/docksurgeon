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
    const image = docker.getImage(id);
    const info = await image.inspect();
    const name = info.RepoTags?.[0] ?? id.slice(7, 19);
    const size = info.Size;

    await image.remove({ force: false });

    db.prepare(
      "INSERT INTO audit_log (action, target_id, target_name, bytes_freed, success) VALUES (?, ?, ?, ?, 1)"
    ).run("remove_image", id, name, size);

    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
