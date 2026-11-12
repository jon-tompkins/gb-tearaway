import { createHash, randomBytes } from "node:crypto";
import { claimPayload, deletePayload, loadPayload, savePayload } from "@/lib/persist";

/**
 * Minimal OAuth 2.1 authorization server for the MCP connector.
 * Identity comes from the existing Google sign-in (next-auth); this layer only
 * issues scoped, revocable tokens so an AI assistant can act as that user.
 * Public clients + PKCE (S256) only. Everything is stored hashed in botb_state
 * under `oauth:*` keys (never `user:*`, so the delivery cron never sees them).
 */

export const ACCESS_TTL_S = 60 * 60; // 1h
export const REFRESH_TTL_S = 60 * 60 * 24 * 90; // 90d
const CODE_TTL_S = 600;

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");
export const b64url = (b: Buffer) => b.toString("base64url");
export const newSecret = () => b64url(randomBytes(32));

/** Public origin the client used (so issuer/resource URLs match what they connected to). */
export function siteOrigin(req: Request): string {
  if (process.env.BOTB_SITE_URL) return process.env.BOTB_SITE_URL.replace(/\/$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${proto}://${host}` : new URL(req.url).origin;
}

export interface OAuthClient {
  client_id: string;
  client_name?: string;
  redirect_uris: string[];
  created: string;
}

export async function registerClient(meta: { client_name?: unknown; redirect_uris?: unknown }): Promise<OAuthClient | { error: string }> {
  const uris = Array.isArray(meta.redirect_uris) ? meta.redirect_uris.filter((u): u is string => typeof u === "string") : [];
  if (!uris.length || uris.length > 10) return { error: "redirect_uris required (max 10)" };
  for (const u of uris) {
    let p: URL;
    try { p = new URL(u); } catch { return { error: `invalid redirect_uri ${u}` }; }
    const local = p.hostname === "localhost" || p.hostname === "127.0.0.1";
    if (p.protocol !== "https:" && !local && !/^[a-z][a-z0-9+.-]*:$/.test(p.protocol)) return { error: "redirect_uri must be https, localhost or a custom app scheme" };
    if (p.protocol === "javascript:" || p.protocol === "data:") return { error: "bad redirect_uri scheme" };
  }
  const client: OAuthClient = {
    client_id: `botb_${newSecret().slice(0, 24)}`,
    client_name: typeof meta.client_name === "string" ? meta.client_name.slice(0, 80) : undefined,
    redirect_uris: uris,
    created: new Date().toISOString(),
  };
  await savePayload(`oauth:client:${client.client_id}`, client);
  return client;
}

export const loadClient = (id: string) => loadPayload<OAuthClient>(`oauth:client:${id}`);

interface CodeRec { userKey: string; email: string; clientId: string; redirectUri: string; challenge: string; exp: number }

export async function issueCode(rec: Omit<CodeRec, "exp">): Promise<string> {
  const code = newSecret();
  await savePayload(`oauth:code:${sha256(code)}`, { ...rec, exp: Date.now() + CODE_TTL_S * 1000 } satisfies CodeRec);
  return code;
}

interface TokenRec { userKey: string; email: string; clientId: string; exp: number }

async function mint(rec: Omit<TokenRec, "exp">) {
  const access = newSecret();
  const refresh = newSecret();
  await savePayload(`oauth:at:${sha256(access)}`, { ...rec, exp: Date.now() + ACCESS_TTL_S * 1000 } satisfies TokenRec);
  await savePayload(`oauth:rt:${sha256(refresh)}`, { ...rec, exp: Date.now() + REFRESH_TTL_S * 1000 } satisfies TokenRec);
  return { access_token: access, token_type: "Bearer", expires_in: ACCESS_TTL_S, refresh_token: refresh, scope: "botb" };
}

export async function exchangeCode(p: { code: string; verifier: string; clientId: string; redirectUri: string }) {
  const key = `oauth:code:${sha256(p.code)}`;
  const rec = await loadPayload<CodeRec>(key);
  if (!rec) return { error: "invalid_grant" as const };
  // single use, even if the rest of the checks fail
  if (!(await claimPayload(`oauth:used:${sha256(p.code)}`, { at: Date.now() }))) return { error: "invalid_grant" as const };
  await deletePayload(key);
  if (rec.exp < Date.now() || rec.clientId !== p.clientId || rec.redirectUri !== p.redirectUri) return { error: "invalid_grant" as const };
  if (b64url(createHash("sha256").update(p.verifier).digest()) !== rec.challenge) return { error: "invalid_grant" as const };
  return { tokens: await mint({ userKey: rec.userKey, email: rec.email, clientId: rec.clientId }) };
}

export async function refreshTokens(p: { refresh: string; clientId: string }) {
  const key = `oauth:rt:${sha256(p.refresh)}`;
  const rec = await loadPayload<TokenRec>(key);
  if (!rec || rec.exp < Date.now() || rec.clientId !== p.clientId) return { error: "invalid_grant" as const };
  if (!(await claimPayload(`oauth:used:${sha256(p.refresh)}`, { at: Date.now() }))) return { error: "invalid_grant" as const };
  await deletePayload(key); // rotate
  return { tokens: await mint({ userKey: rec.userKey, email: rec.email, clientId: rec.clientId }) };
}

export async function verifyBearer(req: Request): Promise<{ userKey: string; email: string } | null> {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get("authorization") ?? "");
  if (!m) return null;
  const rec = await loadPayload<TokenRec>(`oauth:at:${sha256(m[1])}`);
  if (!rec || rec.exp < Date.now()) return null;
  return { userKey: rec.userKey, email: rec.email };
}
