/**
 * Server-only utilities that use Node.js APIs (fs, better-sqlite3, etc.)
 * Do NOT import this file from any Client Component or shared utils.
 */

import db from "@/lib/db";

/**
 * Get the base URL for the application.
 * In production: uses domain from database settings, falls back to NEXTAUTH_URL env
 * In development: uses NEXTAUTH_URL env or localhost:3000
 *
 * Must only be called from Server Components or API Routes.
 */
export function getAppBaseUrl(): string {
  try {
    // Try to get domain from database (production)
    const domain = db
      .prepare("SELECT value FROM settings WHERE key = 'domain'")
      .get() as { value: string } | undefined;

    if (domain?.value) {
      return `https://${domain.value}`;
    }
  } catch {
    // DB not available or query failed, fall back to env
  }

  // Fall back to NEXTAUTH_URL or localhost
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  if (nextAuthUrl) return nextAuthUrl;

  return "http://localhost:3000";
}
