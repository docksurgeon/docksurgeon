import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const domain = db
    .prepare("SELECT value FROM settings WHERE key = 'domain'")
    .get() as { value: string } | undefined;

  return NextResponse.json({
    domain: domain?.value || "",
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { domain } = await req.json();

  if (!domain || typeof domain !== "string") {
    return NextResponse.json({ error: "Domain is required" }, { status: 400 });
  }

  // Validate domain format (basic validation)
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  if (!domainRegex.test(domain)) {
    return NextResponse.json({ error: "Invalid domain format" }, { status: 400 });
  }

  try {
    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
      .run("domain", domain);
    return NextResponse.json({ success: true, domain });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update domain" }, { status: 500 });
  }
}
