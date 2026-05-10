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

    // SaaS Engine: Automatically generate Caddyfile for the user
    const fs = require('fs');
    const path = require('path');
    const dataDir = process.env.DS_DATA_DIR || '/app/data';
    const caddyPath = path.join(dataDir, 'Caddyfile');
    
    const caddyConfig = `${domain} {
    reverse_proxy localhost:4242
    
    header {
        # Enable HSTS
        Strict-Transport-Security "max-age=31536000;"
        # Prevent Clickjacking
        X-Frame-Options "SAMEORIGIN"
        # Content Type Sniffing
        X-Content-Type-Options "nosniff"
    }
}
`;

    try {
      fs.writeFileSync(caddyPath, caddyConfig);
    } catch (e) {
      console.error("Failed to write Caddyfile:", e);
      // We don't fail the whole request because the DB save was successful
    }

    return NextResponse.json({ success: true, domain, caddyUpdated: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update domain" }, { status: 500 });
  }
}
