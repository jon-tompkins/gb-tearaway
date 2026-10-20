import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { auth } from "@/auth";

/**
 * Admin = the owner's Google account. The repo is public, so the default is a
 * SHA-256 of the email rather than the address itself; ADMIN_EMAILS (comma-
 * separated, set on Vercel) adds more admins without a code change.
 */
const ADMIN_EMAIL_HASHES = new Set(["aa6c0a3f7464e60858a4aa8ef9d1e4c327c51e41e62d9faf906158f05c183d56"]);

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  const extra = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(e) || ADMIN_EMAIL_HASHES.has(sha256(e));
}

/** For admin pages: the signed-in admin's email, or a 404 for everyone else. */
export async function requireAdmin(): Promise<string> {
  const session = await auth().catch(() => null);
  const email = session?.user?.email;
  if (!isAdminEmail(email)) notFound();
  return email!;
}
