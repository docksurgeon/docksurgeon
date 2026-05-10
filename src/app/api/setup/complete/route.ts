import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const setting = db
    .prepare("SELECT value FROM settings WHERE key = 'setup_complete'")
    .get() as { value: string } | undefined;

  if (setting?.value === "true") {
    return NextResponse.json({ error: "Already set up" }, { status: 400 });
  }

  const { email, password } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const hash = await bcrypt.hash(password, 12);

  db.prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)").run(
    email,
    hash
  );

  db.prepare(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('setup_complete', 'true')"
  ).run();

  return NextResponse.json({ success: true });
}
