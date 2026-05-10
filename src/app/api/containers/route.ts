import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const containers = await docker.listContainers({ all: true, size: true });
  type ContainerInfoExtended = (typeof containers)[0] & { SizeRw?: number; SizeRootFs?: number };

  return NextResponse.json(
    (containers as ContainerInfoExtended[]).map((c) => ({
      id: c.Id,
      name: c.Names?.[0]?.replace("/", "") ?? c.Id.slice(0, 12),
      image: c.Image,
      imageId: c.ImageID,
      state: c.State,
      status: c.Status,
      created: c.Created,
      sizeRw: c.SizeRw ?? 0,
      sizeRootFs: c.SizeRootFs ?? 0,
      ports: c.Ports ?? [],
      mounts: c.Mounts ?? [],
    }))
  );
}
