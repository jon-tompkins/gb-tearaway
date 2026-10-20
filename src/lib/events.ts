/**
 * Usage events (page views, emails sent) for the admin dashboard, stored in the
 * Supabase `botb_events` table (db/botb_events.sql). Best effort: logging never
 * breaks a request, and without Supabase it's a no-op.
 */
const SUPA_URL = process.env.SUPABASE_URL;
const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export interface UsageEvent {
  ts?: string;
  type: "pageview" | "email_sent";
  path?: string | null;
  visitor?: string | null;
  user_key?: string | null;
  referrer?: string | null;
  meta?: Record<string, unknown> | null;
}

const headers = () => ({
  apikey: SUPA_KEY!,
  Authorization: `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
});

export async function logEvent(e: UsageEvent): Promise<void> {
  if (!SUPA_URL || !SUPA_KEY) return;
  try {
    await fetch(`${SUPA_URL}/rest/v1/botb_events`, {
      method: "POST",
      headers: { ...headers(), Prefer: "return=minimal" },
      body: JSON.stringify(e),
    });
  } catch {
    // best effort
  }
}

/** Events since a time (newest first), paged through PostgREST's row limit. */
export async function eventsSince(sinceISO: string, max = 50_000): Promise<UsageEvent[]> {
  if (!SUPA_URL || !SUPA_KEY) return [];
  const out: UsageEvent[] = [];
  const page = 1000;
  for (let offset = 0; offset < max; offset += page) {
    const res = await fetch(
      `${SUPA_URL}/rest/v1/botb_events?select=ts,type,path,visitor,user_key,referrer,meta&ts=gte.${encodeURIComponent(
        sinceISO,
      )}&order=ts.desc&limit=${page}&offset=${offset}`,
      { headers: headers(), cache: "no-store" },
    );
    if (!res.ok) break;
    const rows = (await res.json()) as UsageEvent[];
    out.push(...rows);
    if (rows.length < page) break;
  }
  return out;
}
