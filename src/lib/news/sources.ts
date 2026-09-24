import type { NewsModuleId } from "../content/news";

/**
 * Real RSS sources per feed. Only feeds listed here pull live headlines (then
 * get rewritten kid-safe by Haiku); the rest fall back to the curated static
 * bank. Sources are mainstream outlets — the rewrite step is what makes them
 * age-appropriate, and it drops anything not kid-safe.
 */
export const NEWS_FEEDS: Partial<Record<NewsModuleId, { url: string; label: string }>> = {
  // Feeds that skew to genuinely kid-appropriate real news (science, nature,
  // discovery, positive/community) so the kid-safe filter keeps plenty.
  news_world: {
    url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    label: "Science & Environment",
  },
  news_national: { url: "https://www.goodnewsnetwork.org/feed/", label: "Good News" },
  news_tech: { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", label: "Technology" },
};
