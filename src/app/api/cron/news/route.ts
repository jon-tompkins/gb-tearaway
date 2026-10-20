import { NextResponse } from "next/server";
import { getDailyNews } from "@/lib/news/daily";
import { NEWS_FEEDS } from "@/lib/news/sources";
import type { NewsModuleId } from "@/lib/content/news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Each feed: pick stories, fetch the articles, write them — about a minute.
export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return new URL(req.url).searchParams.get("secret") === secret;
}

/**
 * News warm-up — run hourly, ahead of the delivery cron. Generates today's
 * stories for every feed (and every hometown in use) once per UTC day; later
 * runs are cheap cache hits. Dispatch renders only ever read this cache.
 */
export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const jobs: { feed: NewsModuleId; city?: string }[] = (
    Object.keys(NEWS_FEEDS) as NewsModuleId[]
  ).map((feed) => ({ feed }));

  // Hometown News is parked (not in the catalog), so no per-city feeds.

  const started = Date.now();
  const results = await Promise.all(
    jobs.map(async (j) => {
      const items = await getDailyNews(j.feed, { city: j.city, generate: true });
      return { feed: j.feed, city: j.city, stories: items?.length ?? 0 };
    }),
  );
  return NextResponse.json({ ms: Date.now() - started, results });
}
