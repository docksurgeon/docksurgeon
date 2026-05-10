import type { NextAuthConfig } from "next-auth";

const PUBLIC_PATHS = ["/login", "/setup", "/api/auth", "/api/setup"];

export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isPublic = PUBLIC_PATHS.some((p) => nextUrl.pathname.startsWith(p));

      if (!isLoggedIn && !isPublic) {
        // Redirect to setup — middleware can't check DB, so redirect to login
        // which will handle the setup check via the setup status API
        return Response.redirect(new URL("/login", nextUrl));
      }

      if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/setup")) {
        return Response.redirect(new URL("/", nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
