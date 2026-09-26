import type { AgeBand, ModuleId } from "../types";
import { shuffle } from "../rng";

export type NewsModuleId =
  | "news_world"
  | "news_national"
  | "news_city"
  | "news_tech"
  | "news_gamer";

export interface NewsItem {
  headline: string;
  /** Dateline location, newspaper-style (rendered in caps before the story). */
  location: string;
  /** The story — a few sentences of real context, kid-friendly. */
  blurb: string;
  /** A closing "did you know" fact. */
  wonder: string;
}

/** A live news item carrying its age bands (from the RSS→Haiku pipeline). */
export type LiveNewsEntry = NewsItem & { bands: AgeBand[] };

const NEWS_IDS = new Set<NewsModuleId>([
  "news_world",
  "news_national",
  "news_city",
  "news_tech",
  "news_gamer",
]);

export function isNewsModule(id: ModuleId): id is NewsModuleId {
  return NEWS_IDS.has(id as NewsModuleId);
}

/**
 * Build a story column from the live daily pool, band-filtered. News is real
 * only — there is no fabricated fallback; when the pool is empty the caller
 * prints nothing.
 */
export function newsListFromPool(
  pool: LiveNewsEntry[],
  band: AgeBand,
  rng: () => number,
  count: number,
): NewsItem[] {
  const fit = pool.filter((n) => n.bands.includes(band));
  const src = fit.length >= count ? fit : pool;
  return shuffle(rng, src)
    .slice(0, Math.min(count, src.length))
    .map((n) => ({ headline: n.headline, location: n.location, blurb: n.blurb, wonder: n.wonder }));
}
