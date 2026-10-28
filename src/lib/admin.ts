import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
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

/**
 * The admin console is also behind a shared password (ADMIN_PASSWORD on Vercel;
 * the default is the one Jon picked). Entering it sets a signed cookie. The
 * owner's Google account skips the password.
 */
export const ADMIN_COOKIE = "botb_admin";
const adminPassword = () => process.env.ADMIN_PASSWORD || "nimda";
const adminToken = () =>
  createHmac("sha256", process.env.AUTH_SECRET || "botb-admin").update(`admin:${adminPassword()}`).digest("hex");

export function passwordOk(candidate: string): boolean {
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(adminPassword()).digest();
  return timingSafeEqual(a, b);
}

export const adminCookieValue = adminToken;

/** True for a valid admin-password cookie or the owner's signed-in Google account. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const c = jar.get(ADMIN_COOKIE)?.value;
  if (c) {
    const a = Buffer.from(c);
    const b = Buffer.from(adminToken());
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  const session = await auth().catch(() => null);
  return isAdminEmail(session?.user?.email);
}

/** For admin pages: returns the admin's email (or "admin"), or sends everyone else to the password screen. */
export async function requireAdmin(): Promise<string> {
  if (!(await isAdmin())) redirect("/admin/login");
  const session = await auth().catch(() => null);
  return session?.user?.email ?? "admin";
}
