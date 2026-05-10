import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import db from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { type: "email" },
        password: { type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = db
          .prepare("SELECT * FROM users WHERE email = ?")
          .get(credentials.email) as
          | { id: number; email: string; password_hash: string }
          | undefined;

        if (!user) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password_hash
        );

        return valid ? { id: String(user.id), email: user.email } : null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
});
