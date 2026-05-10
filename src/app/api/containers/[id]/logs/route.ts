import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import docker from "@/lib/docker";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const tail = req.nextUrl.searchParams.get("tail") ?? "200";

  try {
    const container = docker.getContainer(id);

    const stream = await container.logs({
      follow: true,
      stdout: true,
      stderr: true,
      tail: parseInt(tail),
      timestamps: true,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      start(controller) {
        // Docker multiplexed stream — strip 8-byte header
        (stream as NodeJS.ReadableStream).on("data", (chunk: Buffer) => {
          let offset = 0;
          while (offset < chunk.length) {
            if (chunk.length < offset + 8) break;
            const size = chunk.readUInt32BE(offset + 4);
            const line = chunk
              .slice(offset + 8, offset + 8 + size)
              .toString("utf8");
            if (line.trim()) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(line)}\n\n`)
              );
            }
            offset += 8 + size;
          }
        });

        (stream as NodeJS.ReadableStream).on("end", () => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify("[stream ended]")}\n\n`));
          controller.close();
        });

        (stream as NodeJS.ReadableStream).on("error", () => {
          controller.close();
        });
      },
      cancel() {
        (stream as NodeJS.ReadableStream & { destroy?: () => void }).destroy?.();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(msg, { status: 500 });
  }
}
