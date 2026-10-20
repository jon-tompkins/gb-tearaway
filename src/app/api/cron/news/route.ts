import { NextResponse } from "next/server";
import { feedSource, getDailyNews, headlinesFor } from "@/lib/news/daily";
import { rewriteKidSafe, DEFAULT_NEWS_CONFIG, type NewsConfig } from "@/lib/news/rewrite";
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
/** Model mixes to compare with ?dry=1&variant=… (nothing is saved in a dry run). */
const VARIANTS: Record<string, NewsConfig> = {
  current: DEFAULT_NEWS_CONFIG,
  haiku_pick_check: {
    pick: { model: "claude-haiku-4-5" },
    write: { model: "claude-sonnet-5-5", effort: "medium" },
    check: { model: "claude-haiku-4-5" },
    articleChars: 3500,
  },
  sonnet_low: {
    pick: { model: "claude-haiku-4-5" },
    write: { model: "claude-sonnet-5-5", effort: "low" },
    check: { model: "claude-haiku-4-5" },
    articleChars: 3000,
  },
  haiku55: {
    pick: { model: "claude-haiku-5-5", effort: "low" },
    write: { model: "claude-haiku-5-5", effort: "medium" },
    check: { model: "claude-haiku-5-5", effort: "medium" },
    articleChars: 3500,
  },
};

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const params = new URL(req.url).searchParams;

  // Dry run: run the full pipeline with a model mix and return stories + cost, without saving.
  if (params.get("dry") === "1") {
    const config = VARIANTS[params.get("variant") ?? "current"];
    if (!config) return NextResponse.json({ error: `variants: ${Object.keys(VARIANTS).join(", ")}` }, { status: 400 });
    const started = Date.now();
    const feeds = (Object.keys(NEWS_FEEDS) as NewsModuleId[]).filter((f) => !params.get("feed") || f === params.get("feed"));
    const out = await Promise.all(
      feeds.map(async (feed) => {
        const src = feedSource(feed)!;
        const headlines = await headlinesFor(src.urls);
        const r = await rewriteKidSafe(headlines, src.hint, config);
        return { feed, headlines: headlines.length, usd: r.usage.reduce((a, u) => a + u.usd, 0), usage: r.usage, items: r.items, dropped: r.dropped };
      }),
    );
    return NextResponse.json({ variant: params.get("variant") ?? "current", ms: Date.now() - started, usd: out.reduce((a, f) => a + f.usd, 0), feeds: out });
  }

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
