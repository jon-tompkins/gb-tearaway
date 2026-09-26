import type { ModuleId } from "../types";
import { isNewsModule, type LiveNewsEntry, type NewsModuleId } from "../content/news";
import { loadPayload, savePayload } from "../persist";
import { fetchHeadlines } from "./rss";
import { rewriteKidSafe } from "./rewrite";
import { NEWS_FEEDS } from "./sources";

interface DailyNewsPayload {
  date: string;
  items: LiveNewsEntry[];
}

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Today's real (RSS→Haiku kid-safe) stories for one feed, cached per UTC day.
 * Returns null when live news isn't available for this feed (no source, no API
 * key, fetch/LLM failure, or nothing kid-safe today) → caller uses the static bank.
 */
export async function getDailyNews(feed: NewsModuleId): Promise<LiveNewsEntry[] | null> {
  const source = NEWS_FEEDS[feed];
  // No source or no LLM key → static bank (skip RSS entirely).
  if (!source || !process.env.ANTHROPIC_API_KEY) return null;
  const date = utcDate();
  const key = `news:${date}:${feed}`;

  const cached = await loadPayload<DailyNewsPayload>(key);
  if (cached?.date === date) return cached.items.length ? cached.items : null;

  const headlines = await fetchHeadlines(source.url);
  const items = await rewriteKidSafe(headlines, source.hint);
  // Cache even an empty result to avoid re-hitting RSS/LLM all day.
  await savePayload(key, { date, items } satisfies DailyNewsPayload);
  return items.length ? items : null;
}

/** Gather live daily news for every news feed present in a module pool. */
export async function gatherDailyNews(
  pool: ModuleId[],
): Promise<Partial<Record<NewsModuleId, LiveNewsEntry[]>> | undefined> {
  const feeds = pool.filter((id): id is NewsModuleId => isNewsModule(id) && !!NEWS_FEEDS[id]);
  if (feeds.length === 0) return undefined;
  const out: Partial<Record<NewsModuleId, LiveNewsEntry[]>> = {};
  await Promise.all(
    feeds.map(async (f) => {
      const items = await getDailyNews(f);
      if (items) out[f] = items;
    }),
  );
  return Object.keys(out).length ? out : undefined;
}
