import type { NewsModuleId } from "../content/news";

/**
 * Real RSS sources per feed. Only feeds listed here pull live headlines (then
 * get rewritten kid-safe by Haiku); the rest fall back to the curated static
 * bank. Sources are mainstream outlets — the rewrite step is what makes them
 * age-appropriate, and it drops anything not kid-safe.
 */
export const NEWS_FEEDS: Partial<
  Record<NewsModuleId, { url: string | string[]; label: string; hint?: string }>
> = {
  // Feeds that skew to genuinely kid-appropriate real news (science, nature,
  // discovery, positive/community) so the kid-safe filter keeps plenty.
  news_world: {
    url: "https://feeds.bbci.co.uk/news/science_and_environment/rss.xml",
    label: "Science & Environment",
  },
  news_national: { url: "https://www.goodnewsnetwork.org/feed/", label: "Good News" },
  news_tech: { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", label: "Technology" },
  // Gaming across all three consoles (Nintendo / PlayStation / Xbox) plus a
  // general gaming outlet. The safety filter still drops mature titles.
  news_gamer: {
    url: [
      "https://www.nintendolife.com/feeds/latest",
      "https://www.pushsquare.com/feeds/latest",
      "https://www.purexbox.com/feeds/latest",
      "https://www.gamesradar.com/rss/",
    ],
    label: "Gaming",
    hint: "These are video-game headlines across Nintendo, PlayStation, Xbox, and PC. Kids want REAL game news, so KEEP and report factually (name the game / date / result): new game announcements and RELEASE DATES, game updates and new features, ESPORTS and tournament RESULTS, speedrun records, and console news. This overrides the 'wholesome only' rule for gaming — a normal game release or tournament score is fine. STILL DROP mature/violent/scary titles (shooters, horror, anything rated Teen+), gambling/loot-box topics, unconfirmed leaks/rumors, and anything not kid-safe. For 'wonder', give a fun true fact about the game or series.",
  },
};

/** Google News RSS search for a city — the Hometown News source (kid-safe
 * filter drops the crime/politics; wholesome keywords lift local good news). */
export function cityFeedUrl(city: string): string {
  const q = `"${city}" (community OR school OR park OR library OR festival OR students OR neighborhood OR kids)`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
}
