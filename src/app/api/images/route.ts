import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [images, containers] = await Promise.all([
    docker.listImages({ all: false }),
    docker.listContainers({ all: true }),
  ]);

  const usedImageIds = new Set(containers.map((c) => c.ImageID));

  return NextResponse.json(
    images.map((img) => ({
      id: img.Id,
      shortId: img.Id.slice(7, 19),
      tags: img.RepoTags ?? [],
      size: img.Size,
      sharedSize: img.SharedSize,
      created: img.Created,
      inUse: usedImageIds.has(img.Id),
      containers: img.Containers,
    }))
  );
}
