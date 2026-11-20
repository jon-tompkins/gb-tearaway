import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieValue, allowAdminPasswordAttempt, passwordOk } from "@/lib/admin";

export const dynamic = "force-dynamic";

function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  const raw = (fwd ? fwd.split(",")[0] : req.headers.get("x-real-ip"))?.trim();
  return raw || "unknown";
}

/** POST { password } sets the admin cookie. DELETE signs out of the admin console. */
export async function POST(req: Request) {
  if (!allowAdminPasswordAttempt(clientIp(req))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  const token = typeof password === "string" && passwordOk(password) ? adminCookieValue() : null;
  if (!token) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
