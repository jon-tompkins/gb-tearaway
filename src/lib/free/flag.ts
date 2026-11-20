type Env = Record<string, string | undefined>;

/**
 * Free daily editions stay dark until FREE_EDITIONS_ENABLED is turned on.
 * Unset, empty, "0", and "false" are off. Nothing in this feature sends mail
 * while the flag is off.
 */
export function freeEditionsEnabled(env: Env = process.env): boolean {
  const v = (env.FREE_EDITIONS_ENABLED ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "on" || v === "yes";
}

/** Pages and signup routes 404 when the flag is off. */
export function freeEditionAccess(env: Env = process.env): { ok: true } | { ok: false; status: 404 } {
  return freeEditionsEnabled(env) ? { ok: true } : { ok: false, status: 404 };
}

/**
 * CAN-SPAM physical address. Empty means refuse to send (callers log and skip).
 */
export function freeMailingAddress(env: Env = process.env): string {
  return (env.FREE_EDITION_MAILING_ADDRESS ?? "").trim();
}

/** Public site origin used in email links. */
export function siteOrigin(): string {
  return (process.env.EMAIL_SITE_URL || "https://www.backofthebox.xyz").replace(/\/$/, "");
}

export function requestOrigin(req: Request): string {
  const url = new URL(req.url);
  const host = req.headers.get("x-forwarded-host") ?? url.host;
  const proto = req.headers.get("x-forwarded-proto") ?? url.protocol.replace(/:$/, "");
  return `${proto}://${host}`;
}
