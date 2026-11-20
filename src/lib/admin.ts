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

type Env = Record<string, string | undefined>;

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function isAdminEmail(email: string | null | undefined, env: Env = process.env): boolean {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  const extra = (env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return extra.includes(e) || ADMIN_EMAIL_HASHES.has(sha256(e));
}

/**
 * Password login is optional. It is off unless ADMIN_PASSWORD is set and at
 * least 16 characters — there is no default password. A correct password sets
 * a cookie MAC'd with AUTH_SECRET only. If AUTH_SECRET is unset, cookies are
 * neither signed nor accepted. The owner's Google account skips the password.
 */
export const MIN_ADMIN_PASSWORD_LENGTH = 16;
export const ADMIN_COOKIE = "botb_admin";

function configuredPassword(env: Env): string | null {
  const pw = env.ADMIN_PASSWORD;
  if (typeof pw !== "string" || pw.length < MIN_ADMIN_PASSWORD_LENGTH) return null;
  return pw;
}

function configuredSecret(env: Env): string | null {
  const secret = env.AUTH_SECRET;
  if (typeof secret !== "string" || secret.length === 0) return null;
  return secret;
}

export function passwordLoginEnabled(env: Env = process.env): boolean {
  return configuredPassword(env) !== null;
}

/** Constant-time check. False when password login is off, including for any old default. */
export function passwordOk(candidate: unknown, env: Env = process.env): boolean {
  const pw = configuredPassword(env);
  if (!pw || typeof candidate !== "string") return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(pw).digest();
  return timingSafeEqual(a, b);
}

/** Cookie value, or null when it must not be issued (no AUTH_SECRET, or password login off). */
export function adminCookieValue(env: Env = process.env): string | null {
  const secret = configuredSecret(env);
  const pw = configuredPassword(env);
  if (!secret || !pw) return null;
  return createHmac("sha256", secret).update(`admin:${pw}`).digest("hex");
}

export function adminCookieValid(cookie: string | null | undefined, env: Env = process.env): boolean {
  const expected = adminCookieValue(env);
  if (!expected || !cookie) return false;
  const a = Buffer.from(cookie);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Cookie path or the owner Google account. Same decision isAdmin makes for a request. */
export function hasAdminAccess(
  input: { cookie?: string | null; email?: string | null },
  env: Env = process.env,
): boolean {
  if (adminCookieValid(input.cookie, env)) return true;
  return isAdminEmail(input.email, env);
}

const passwordAttempts = new Map<string, { n: number; reset: number }>();
const PASSWORD_ATTEMPT_LIMIT = 8;
const PASSWORD_ATTEMPT_WINDOW_MS = 15 * 60_000;

/** In-memory cap on password guesses for this instance. Fails closed once the window is full. */
export function allowAdminPasswordAttempt(ip: string, now = Date.now()): boolean {
  const key = (ip.trim() || "unknown").slice(0, 80);
  if (passwordAttempts.size > 5000) {
    for (const [k, v] of passwordAttempts) if (v.reset <= now) passwordAttempts.delete(k);
  }
  const cur = passwordAttempts.get(key);
  if (!cur || cur.reset <= now) {
    passwordAttempts.set(key, { n: 1, reset: now + PASSWORD_ATTEMPT_WINDOW_MS });
    return true;
  }
  cur.n += 1;
  return cur.n <= PASSWORD_ATTEMPT_LIMIT;
}

/** True for a valid admin-password cookie or the owner's signed-in Google account. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const cookie = jar.get(ADMIN_COOKIE)?.value;
  if (adminCookieValid(cookie)) return true;
  const session = await auth().catch(() => null);
  return hasAdminAccess({ email: session?.user?.email });
}

/** For admin pages: returns the admin's email (or "admin"), or sends everyone else to the password screen. */
export async function requireAdmin(): Promise<string> {
  if (!(await isAdmin())) redirect("/admin/login");
  const session = await auth().catch(() => null);
  return session?.user?.email ?? "admin";
}
