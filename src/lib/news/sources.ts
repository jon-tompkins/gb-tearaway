import type { NewsModuleId } from "../content/news";

/**
 * Real RSS sources per feed. Only feeds listed here pull live headlines (then
 * get rewritten kid-safe by Haiku); the rest fall back to the curated static
 * bank. Sources are mainstream outlets — the rewrite step is what makes them
 * age-appropriate, and it drops anything not kid-safe.
 */
export const NEWS_FEEDS: Partial<
  Record<NewsModuleId, { url: string; label: string; hint?: string }>
> = {
  // Feeds that skew to genuinely kid-appropriate real news (science, nature,
  // discovery, positive/community) so the kid-safe filter keeps plenty.
  news_world: {
    url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    label: "Science & Environment",
  },
  news_national: { url: "https://www.goodnewsnetwork.org/feed/", label: "Good News" },
  news_tech: { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", label: "Technology" },
  // Family-friendly gaming source. The hint widens the "keep" rules to include
  // kid-appropriate gaming, while the safety filter still drops mature titles.
  news_gamer: {
    url: "https://www.nintendolife.com/feeds/latest",
    label: "Gaming",
    hint: "These are video-game headlines. In ADDITION to the usual wholesome topics, KEEP kid-appropriate gaming news: new family-friendly games and updates, fun features, Nintendo/console news, esports sportsmanship, speedruns, and cool game-making tech. STILL DROP mature/violent/scary games (shooters, horror, anything rated Teen+), in-game purchases/gambling, leaks, and any non-kid-safe topic. Rewrite as a fun, factual gaming tidbit.",
  },
};
