import type { ModuleId } from "../types";
import { isNewsModule, type LiveNewsEntry, type NewsModuleId } from "../content/news";
import { loadPayload, savePayload } from "../persist";
import { fetchHeadlines, type RawHeadline } from "./rss";
import { rewriteKidSafe } from "./rewrite";
import { NEWS_FEEDS, cityFeedUrl } from "./sources";

interface DailyNewsPayload {
  date: string;
  items: LiveNewsEntry[];
}

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Fetch several feeds and merge, capped per source so one Haiku call stays small. */
async function fetchMany(urls: string[], perSource = 10): Promise<RawHeadline[]> {
  const lists = await Promise.all(urls.map((u) => fetchHeadlines(u)));
  return lists.flatMap((l) => l.slice(0, perSource));
}

/**
 * Today's real (RSS→Haiku kid-safe) stories for one feed, cached per UTC day.
 * Returns null when live news isn't available (no source, no API key, fetch/LLM
 * failure, or nothing kid-safe today) → the caller prints nothing (no fallback).
 */
export async function getDailyNews(
  feed: NewsModuleId,
  opts: { city?: string } = {},
): Promise<LiveNewsEntry[] | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  // Resolve the source URL(s) + a cache-key suffix + an optional rewrite hint.
  let urls: string[];
  let cacheSuffix = "";
  let hint: string | undefined;
  if (feed === "news_city") {
    const city = (opts.city ?? "").trim();
    if (!city) return null; // no city set → no hometown news
    urls = [cityFeedUrl(city)];
    cacheSuffix = `:${city.toLowerCase()}`;
    hint =
      "These are LOCAL headlines for the reader's hometown. Keep only genuinely kid-safe local good news (schools, parks, libraries, festivals, community/kindness, young athletes, local science/nature). Use the town name in the location. DROP crime, politics, accidents, and anything scary or adult.";
  } else {
    const source = NEWS_FEEDS[feed];
    if (!source) return null;
    urls = Array.isArray(source.url) ? source.url : [source.url];
    hint = source.hint;
  }

  const date = utcDate();
  const key = `news:${date}:${feed}${cacheSuffix}`;
  const cached = await loadPayload<DailyNewsPayload>(key);
  if (cached?.date === date) return cached.items.length ? cached.items : null;

  const headlines = urls.length > 1 ? await fetchMany(urls) : await fetchHeadlines(urls[0]);
  const items = await rewriteKidSafe(headlines, hint);
  await savePayload(key, { date, items } satisfies DailyNewsPayload);
  return items.length ? items : null;
}

/** Gather live daily news for every news feed present in a module pool. */
export async function gatherDailyNews(
  pool: ModuleId[],
  opts: { city?: string } = {},
): Promise<Partial<Record<NewsModuleId, LiveNewsEntry[]>> | undefined> {
  const feeds = pool.filter(
    (id): id is NewsModuleId =>
      isNewsModule(id) && (id === "news_city" ? !!opts.city : !!NEWS_FEEDS[id]),
  );
  if (feeds.length === 0) return undefined;
  const out: Partial<Record<NewsModuleId, LiveNewsEntry[]>> = {};
  await Promise.all(
    feeds.map(async (f) => {
      const items = await getDailyNews(f, opts);
      if (items) out[f] = items;
    }),
  );
  return Object.keys(out).length ? out : undefined;
}
