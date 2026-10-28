import Anthropic from "@anthropic-ai/sdk";
import type { AgeBand } from "./types";
import { fetchHeadlines, type RawHeadline } from "./news/rss";
import { loadPayload, savePayload } from "./persist";

/**
 * Team News: recent real headlines about a kid's favorite team(s), rewritten
 * kid-safe. Per team: Google News RSS search → strip " - Outlet" → dedupe →
 * deterministic keyword pre-filter → ONE Haiku call that picks up to 3 items
 * and writes a 1–2 sentence summary grounded only in the headline/snippet.
 * Cached per team per UTC day; empties cached for at most an hour. Render-time
 * generation is capped so a slow call can't sink the emailed PDF.
 * Never fabricates — no key / no safe items → no stories.
 */

export const TEAM_NEWS_MAX_TEAMS = 2;
export const TEAM_NEWS_PER_TEAM = 3;
const MODEL = "claude-haiku-4-5";
const DEFAULT_TIMEOUT_MS = 12_000;
const EMPTY_TTL_MS = 60 * 60 * 1000;
const MAX_CANDIDATES = 15;

export interface TeamNewsItem {
  headline: string;
  /** For 7-12: 1–2 plain sentences. */
  summary: string;
  /** For 4-6: shorter words, one short sentence or two. */
  summaryYoung: string;
  outlet?: string;
  url?: string;
}

export interface TeamNewsResult {
  team: string;
  items: TeamNewsItem[];
}

interface CachedTeamNews {
  team: string;
  items: TeamNewsItem[];
  /** ms epoch when generated — empties expire after EMPTY_TTL_MS. */
  at: number;
}

/** (system, user) → raw model text. Injected so tests can stub the LLM. */
export type LlmFn = (system: string, user: string) => Promise<string>;

export interface TeamNewsDeps {
  llm?: LlmFn | null;
  fetchFeed?: (url: string) => Promise<RawHeadline[]>;
  load?: (key: string) => Promise<unknown>;
  save?: (key: string, value: unknown) => Promise<void>;
  now?: () => number;
  timeoutMs?: number;
}

export interface Candidate {
  title: string;
  outlet: string;
  snippet: string;
  url?: string;
  published?: string;
}

// ---------- pure helpers ----------

/** "Lakers win opener - ESPN" → { title: "Lakers win opener", outlet: "ESPN" }. */
export function cleanTitle(raw: string): { title: string; outlet: string } {
  const t = raw.replace(/\s+/g, " ").trim();
  const i = t.lastIndexOf(" - ");
  if (i > 0) {
    const outlet = t.slice(i + 3).trim();
    // Outlet names are short; a long tail is part of the headline itself.
    if (outlet && outlet.split(" ").length <= 6 && outlet.length <= 50) {
      return { title: t.slice(0, i).trim(), outlet };
    }
  }
  return { title: t, outlet: "" };
}

/** Google News descriptions are just "<a>title</a> outlet" — keep only real extra text. */
function cleanSnippet(summary: string, title: string, outlet: string): string {
  const s = summary
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) return "";
  const norm = (x: string) => x.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const rest = norm(s).replace(norm(title), "").replace(norm(outlet), "").trim();
  return rest.length < 15 ? "" : s.slice(0, 300);
}

function tokens(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

/** Drop near-identical headlines (same story from several outlets). */
export function dedupeCandidates(list: Candidate[], threshold = 0.6): Candidate[] {
  const out: Candidate[] = [];
  const seen: Set<string>[] = [];
  for (const c of list) {
    const t = tokens(c.title);
    const dup = seen.some((s) => {
      const inter = [...t].filter((w) => s.has(w)).length;
      const union = new Set([...t, ...s]).size || 1;
      return inter / union >= threshold;
    });
    if (dup) continue;
    seen.push(t);
    out.push(c);
  }
  return out;
}

// Defence in depth — the LLM also filters, but these never reach it.
const BLOCK: RegExp[] = [
  // injuries / health / death
  /\binjur(y|ies|ed)\b/i, /\bconcussion/i, /\bsurgery\b/i, /\btorn\b/i, /\bacl\b/i, /\bhospital/i,
  /\bout for (the )?season\b/i, /\b(dies|died|dead|death|deaths|killed|passes away|passed away|funeral|mourn\w*|vigil|obituary)\b/i,
  // crime / legal ("court" alone is a basketball court — only legal phrasings)
  /\b(arrest\w*|police|charged with|indict\w*|lawsuit|sue[sd]?|suing|court (case|ruling|hearing|date|order)|courtroom|judge|trial|jail|prison|felony|dui|crime|criminal|investigation|allegation\w*|accus\w*)\b/i,
  // violence ("Gunners", "hot shooting", "stable" must survive)
  /\b(assault\w*|abuse\w*|domestic (violence|abuse|dispute)|harass\w*|violence|violent|guns?|gunfire|gunman|shot dead|shooting (victim|suspect|incident)|stabb(ed|ing)|murder\w*|weapons?)\b/i,
  // gambling / betting ("draft picks" must survive)
  /\b(bet|bets|betting|bettors?|odds|sportsbooks?|gambl\w*|parlays?|wager\w*|point spread|against the spread|over\/under|moneyline|prop bets?|player props|(best|expert|staff|free|top) picks?|predictions?|fanduel|draftkings|fantasy)\b/i,
  // fights / scandal / adult
  /\b(brawl\w*|fistfight|fights? broke out|punch(ed|es|ing)|scuffle|altercation|ejected|suspen(ded|sion))\b/i,
  /\b(scandal\w*|doping|steroids?|drugs?|peds?|banned substance|sex\w*|nude|explicit|alcohol|beer|cannabis|marijuana)\b/i,
  // rumour / speculation
  /\b(rumou?rs?|rumou?red|speculat\w*|reportedly|sources say|could|might|mock draft)\b/i,
  // ownership / sale drama ("sold out" crowds are fine)
  /\b(sale|selling|sells|buyers?|takeover|valuation)\b/i, /\bsold\b(?! out)/i, /\bownership\b/i,
];

/** True when a headline/snippet trips any hard-block keyword. */
export function isBlocked(text: string): boolean {
  return BLOCK.some((r) => r.test(text));
}

export function preFilter(list: Candidate[]): Candidate[] {
  return list.filter((c) => !isBlocked(`${c.title} ${c.snippet}`));
}

/** RSS rows → cleaned, deduped, pre-filtered candidates (newest first when dated). */
export function toCandidates(rows: RawHeadline[]): Candidate[] {
  const cands = rows.map((r) => {
    const { title, outlet } = cleanTitle(r.title);
    return { title, outlet, snippet: cleanSnippet(r.summary, title, outlet), url: r.link, published: r.published };
  });
  const dated = cands
    .map((c, i) => ({ c, i, t: c.published ? Date.parse(c.published) : NaN }))
    .sort((a, b) => (Number.isNaN(a.t) || Number.isNaN(b.t) ? a.i - b.i : b.t - a.t))
    .map((x) => x.c);
  return preFilter(dedupeCandidates(dated)).slice(0, MAX_CANDIDATES);
}

export const TEAM_NEWS_SYSTEM = `You pick and summarize sports news about one team for a printed children's newspaper (ages 4-12). You get a numbered list of real recent headlines (sometimes with a short snippet). You have NOTHING else — no article text.

Kid safety (non-negotiable). DROP any item about: injuries or health problems, deaths, crime, arrests, police, lawsuits or court, gambling, betting, odds, picks or fantasy betting, fights or violence, abuse, scandals, drugs, rumors, reports or speculation ("could", "might", "reportedly"), drama about selling or owning the team, or anything adult, scary or sad. When unsure, drop it.

KEEP: game results, wins and streaks, signings and trades that already happened, records, awards, standout performances, schedule and season news, community and charity stories.

Grounding: write ONLY what the headline/snippet says. Never invent scores, stats, quotes, names, dates or details. If the headline is too vague to summarize truthfully, skip it. Skip near-duplicates (same story twice).

For each pick (up to ${TEAM_NEWS_PER_TEAM}, best and most recent first):
- n: the item number.
- headline: at most 8 words, sentence case, plain and specific. No puns, no exclamation marks.
- summary: 1-2 short sentences a 9-year-old can read.
- young: the same news in 1-2 very short sentences with simple words, for a 5-year-old.

Return ONLY minified JSON: {"items":[{"n":1,"headline":"...","summary":"...","young":"..."}]}. If nothing qualifies, {"items":[]}.`;

export function buildTeamNewsPrompt(team: string, cands: Candidate[]): string {
  const list = cands
    .map((c, i) => `${i + 1}. ${c.title}${c.snippet ? ` — ${c.snippet}` : ""}${c.published ? ` (${c.published})` : ""}`)
    .join("\n");
  return `Team: ${team}\n\nRecent headlines:\n${list}`;
}

const str = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");
const wordCount = (s: string) => s.split(/\s+/).filter(Boolean).length;

/** Model text → validated items mapped back to their source candidates. */
export function parseTeamNews(text: string, cands: Candidate[]): TeamNewsItem[] {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b < a) return [];
  let data: unknown;
  try {
    data = JSON.parse(text.slice(a, b + 1));
  } catch {
    return [];
  }
  const items = (data as { items?: unknown })?.items;
  if (!Array.isArray(items)) return [];
  const out: TeamNewsItem[] = [];
  const used = new Set<number>();
  for (const raw of items) {
    const o = (raw ?? {}) as Record<string, unknown>;
    const n = Number(String(o.n ?? "").match(/\d+/)?.[0] ?? NaN);
    const src = cands[n - 1];
    if (!src || used.has(n)) continue;
    const headline = str(o.headline);
    const summary = str(o.summary);
    const young = str(o.young) || summary;
    if (!headline || !summary) continue;
    if (wordCount(summary) > 60 || wordCount(headline) > 14) continue;
    // Belt and braces: the rewrite must not reintroduce blocked topics.
    if (isBlocked(`${headline} ${summary} ${young}`)) continue;
    used.add(n);
    out.push({ headline, summary, summaryYoung: young, outlet: src.outlet || undefined, url: src.url });
    if (out.length >= TEAM_NEWS_PER_TEAM) break;
  }
  return out;
}

export function teamNewsFeedUrl(team: string, quoted = true): string {
  const q = `${quoted ? `"${team}"` : team} when:3d`;
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
}

export function teamNewsCacheKey(team: string, date: string): string {
  return `teamnews:${date}:${team.trim().toLowerCase()}`;
}

/** Resolve `p`, or `fallback` after `ms` (the underlying work keeps running). */
export function withTimeout<T>(p: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    p.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}

// ---------- default (real) deps ----------

/** Real Haiku call; null without a key. */
export function defaultLlm(): LlmFn | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  return async (system, user) => {
    const msg = await new Anthropic().messages.create({
      model: MODEL,
      max_tokens: 1200,
      system,
      messages: [{ role: "user", content: user }],
    });
    if (msg.stop_reason !== "end_turn") return "";
    return msg.content
      .map((c) => (c.type === "text" ? c.text : ""))
      .join("")
      .trim();
  };
}

async function fetchFeedSafe(url: string): Promise<RawHeadline[]> {
  try {
    return await fetchHeadlines(url, 40);
  } catch {
    return [];
  }
}

// ---------- per-team generation ----------

/** Same team+day requested concurrently (two kids, two routes) → one call. */
const inflight = new Map<string, Promise<TeamNewsItem[] | null>>();

/**
 * Fetch + rewrite one team's news. Returns null on hard failure (network /
 * model error) so the caller doesn't cache it; [] means "looked, nothing safe".
 */
async function generateTeamNews(team: string, llm: LlmFn, fetchFeed: (u: string) => Promise<RawHeadline[]>) {
  let rows = await fetchFeed(teamNewsFeedUrl(team, true));
  // Quoted + when:3d sometimes returns nothing for long names; retry unquoted.
  if (!rows.length) rows = await fetchFeed(teamNewsFeedUrl(team, false));
  if (!rows.length) return null;
  const cands = toCandidates(rows);
  if (!cands.length) return [];
  let text: string;
  try {
    text = await llm(TEAM_NEWS_SYSTEM, buildTeamNewsPrompt(team, cands));
  } catch (e) {
    console.error("[teamnews] llm failed:", e instanceof Error ? e.message : e);
    return null;
  }
  return parseTeamNews(text, cands);
}

export async function getTeamNews(team: string, deps: TeamNewsDeps = {}): Promise<TeamNewsResult> {
  const name = team.trim();
  const now = deps.now ?? Date.now;
  const load = deps.load ?? ((k: string) => loadPayload<unknown>(k));
  const save = deps.save ?? savePayload;
  const llm = deps.llm === undefined ? defaultLlm() : deps.llm;
  const fetchFeed = deps.fetchFeed ?? fetchFeedSafe;
  const date = new Date(now()).toISOString().slice(0, 10);
  const key = teamNewsCacheKey(name, date);

  const cached = (await load(key).catch(() => null)) as CachedTeamNews | null;
  if (cached && Array.isArray(cached.items)) {
    const fresh = cached.items.length > 0 || now() - (cached.at ?? 0) < EMPTY_TTL_MS;
    if (fresh) return { team: name, items: cached.items };
  }
  if (!llm) return { team: name, items: [] };

  let job = inflight.get(key);
  if (!job) {
    job = generateTeamNews(name, llm, fetchFeed)
      .then(async (items) => {
        // Cache real results for the day; "nothing safe" for ≤1h (via `at`);
        // never cache hard failures. Saves even if the render already timed out,
        // so the next render picks it up.
        if (items) await save(key, { team: name, items, at: now() } satisfies CachedTeamNews).catch(() => {});
        return items;
      })
      .catch(() => null)
      .finally(() => inflight.delete(key));
    inflight.set(key, job);
  }
  const items = await withTimeout(job, deps.timeoutMs ?? DEFAULT_TIMEOUT_MS, null);
  return { team: name, items: items ?? [] };
}

/**
 * News for a kid's first TEAM_NEWS_MAX_TEAMS favorite teams, in parallel.
 * undefined = no teams set (card asks the parent to add one).
 */
export async function gatherTeamNews(teams: string[], deps: TeamNewsDeps = {}): Promise<TeamNewsResult[] | undefined> {
  const list = [...new Set(teams.map((t) => t.trim()).filter(Boolean))].slice(0, TEAM_NEWS_MAX_TEAMS);
  if (!list.length) return undefined;
  return Promise.all(list.map((t) => getTeamNews(t, deps)));
}

/** Pick the summary wording for the kid's age band. */
export function teamNewsBlurb(item: TeamNewsItem, band: AgeBand): string {
  return band === "4-6" ? item.summaryYoung || item.summary : item.summary;
}
