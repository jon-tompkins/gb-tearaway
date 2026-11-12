import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueCode, loadClient, type OAuthClient } from "@/lib/mcp/oauth";

type Valid = { ok: false; fatal: string } | { ok: true; client: OAuthClient; redirectUri: string; challenge: string; state: string };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const page = (body: string, status = 200) =>
  new NextResponse(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Back of the Box</title>
<body style="font-family:Georgia,serif;background:#f5efe1;color:#1c1915;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0">
<main style="max-width:30rem;padding:1.5rem;text-align:center">${body}</main>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Frame-Options": "DENY" } },
  );

async function validate(p: URLSearchParams): Promise<Valid> {
  const clientId = p.get("client_id") ?? "";
  const redirectUri = p.get("redirect_uri") ?? "";
  const client = clientId ? await loadClient(clientId) : null;
  if (!client || !client.redirect_uris.includes(redirectUri)) return { ok: false, fatal: "Unknown app or redirect address." };
  if (p.get("response_type") !== "code" || p.get("code_challenge_method") !== "S256" || !p.get("code_challenge")) {
    return { ok: false, fatal: "This app must use the authorization code flow with PKCE (S256)." };
  }
  return { ok: true, client, redirectUri, challenge: p.get("code_challenge")!, state: p.get("state") ?? "" };
}

function back(redirectUri: string, params: Record<string, string>) {
  const u = new URL(redirectUri);
  for (const [k, v] of Object.entries(params)) if (v) u.searchParams.set(k, v);
  return NextResponse.redirect(u.toString(), 302);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const v = await validate(url.searchParams);
  if (!v.ok) return page(`<h1>Can't connect</h1><p>${esc(v.fatal)}</p>`, 400);
  const session = await auth().catch(() => null);
  const email = session?.user?.email;
  if (!email) {
    const cb = `${url.pathname}${url.search}`;
    return NextResponse.redirect(new URL(`/api/auth/signin?callbackUrl=${encodeURIComponent(cb)}`, req.url), 302);
  }
  const hidden = ["client_id", "redirect_uri", "response_type", "code_challenge", "code_challenge_method", "state"]
    .map((k) => `<input type="hidden" name="${k}" value="${esc(url.searchParams.get(k) ?? "")}">`)
    .join("");
  const btn = "font:inherit;font-size:1.2rem;padding:.9rem 1.6rem;border-radius:1rem;cursor:pointer;margin:.3rem";
  return page(
    `<h1>Connect ${esc(v.client.client_name || "an app")}?</h1>
<p style="font-size:1.1rem">It will be able to see and change your Back of the Box pages, and send you today's page, as <strong>${esc(email)}</strong>. You can stop it any time by disconnecting in that app.</p>
<form method="post">${hidden}
<button name="decision" value="allow" style="${btn};background:#1c1915;color:#f5efe1;border:0">Allow</button>
<button name="decision" value="deny" style="${btn};background:#fff;border:2px solid #cfc4b0;color:#1c1915">Cancel</button></form>`,
  );
}

export async function POST(req: Request) {
  const f = await req.formData();
  const p = new URLSearchParams();
  for (const [k, val] of f.entries()) if (typeof val === "string") p.set(k, val);
  const v = await validate(p);
  if (!v.ok) return page(`<h1>Can't connect</h1><p>${esc(v.fatal)}</p>`, 400);
  const session = await auth().catch(() => null);
  const email = session?.user?.email;
  if (!email) return page("<h1>Please sign in first</h1>", 401);
  if (p.get("decision") !== "allow") return back(v.redirectUri, { error: "access_denied", state: v.state });
  const code = await issueCode({ userKey: `user:${email.toLowerCase()}`, email, clientId: v.client.client_id, redirectUri: v.redirectUri, challenge: v.challenge });
  return back(v.redirectUri, { code, state: v.state });
}
