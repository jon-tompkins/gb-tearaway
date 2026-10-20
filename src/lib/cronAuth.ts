/** Cron/internal auth: Vercel Cron sends `Authorization: Bearer $CRON_SECRET`; `?secret=` for manual runs. */
export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured → allow (dev)
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}
