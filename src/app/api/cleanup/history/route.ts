import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import db from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const logs = db
    .prepare("SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100")
    .all();

  return NextResponse.json(logs);
}
