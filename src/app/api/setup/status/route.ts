import { NextResponse } from "next/server";
import db from "@/lib/db";

export function GET() {
  const setting = db
    .prepare("SELECT value FROM settings WHERE key = 'setup_complete'")
    .get() as { value: string } | undefined;

  return NextResponse.json({ complete: setting?.value === "true" });
}
