import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";
import db from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(session.user?.email) as
    | { id: number; password_hash: string }
    | undefined;

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) return NextResponse.json({ error: "Current password incorrect" }, { status: 400 });

  const hash = await bcrypt.hash(newPassword, 12);
  db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(hash, user.id);

  return NextResponse.json({ success: true });
}
