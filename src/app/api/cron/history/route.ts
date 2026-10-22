import { NextResponse } from "next/server";
import { getDailyHistory, lastHistoryError } from "@/lib/news/history-live";
import { loadPayload } from "@/lib/persist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

/**
 * History warm-up. With no params it builds the next 7 days (cheap once
 * built — cache hits). Backfill the whole year with ?from=MM-DD&count=N
 * (a leap year is used so 02-29 is included). ?force=1 is not supported:
 * delete the `history2:MM-DD` key to rebuild a day.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const url = new URL(req.url);
  const count = Math.min(Number(url.searchParams.get("count") ?? 7) || 7, 40);
  const from = url.searchParams.get("from");
  const start = from ? new Date(`2028-${from}T12:00:00Z`) : new Date();
  if (Number.isNaN(start.getTime())) return NextResponse.json({ error: "bad from" }, { status: 400 });

  const days: string[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    days.push(`2028-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`);
  }
  const results: Record<string, number | string> = {};
  // A few at a time keeps well inside the function timeout and rate limits.
  for (let i = 0; i < days.length; i += 3) {
    await Promise.all(
      days.slice(i, i + 3).map(async (iso) => {
        const md = iso.slice(5);
        const had = await loadPayload(`history2:${md}`);
        const items = await getDailyHistory(iso);
        results[md] = items ? (had ? `cached ${items.length}` : items.length) : `failed: ${lastHistoryError}`;
      }),
    );
  }
  return NextResponse.json({ ok: true, results });
}
