import Anthropic from "@anthropic-ai/sdk";
import type { AgeBand } from "../types";
import type { LiveNewsEntry } from "../content/news";
import type { RawHeadline } from "./rss";
import { fetchArticleText } from "./article";

/**
 * Two steps, so stories are real AND worth reading:
 *  1. PICK — from the day's headlines, choose the few genuinely interesting,
 *     kid-safe news events (drops anniversaries, listicles, promos, grim stuff).
 *  2. WRITE — fetch each chosen article and write from the actual text, so the
 *     blurb carries the real names, numbers and details instead of filler.
 * Runs once per feed per day in the news warm-up cron, so speed doesn't matter.
 */
const MODEL = "claude-opus-5-5";
const BANDS: AgeBand[] = ["4-6", "7-9", "10-12"];
const MAX_STORIES = 8;

const client = () => new Anthropic();

const SAFETY = `Kid safety (non-negotiable): DROP anything touching death, injury, violence, war, weapons, crime, terrorism, disasters or accidents, abuse, illness, protests, elections or partisan politics, money scandals, celebrity private lives, or anything scary, sad or adult. When unsure, drop it.`;

const PICK_SYSTEM = `You are the front-page editor of a printed morning newspaper for children aged 4-12. From a numbered list of today's real headlines, pick the stories most worth a curious kid's two minutes.

${SAFETY}

A good pick is a real NEWS EVENT that happened or was announced recently, with something a kid would want to tell someone at breakfast: a discovery, a first, a record, a rescue, a clever invention, an animal doing something surprising, a place or project with a vivid detail.

Skip: birthdays and "on this day" anniversaries, listicles and roundups ("10 ways to…", "what went right this week"), opinion pieces, product or app promotion, business results, vague trend pieces, and stories whose only point is that something is "good news". Prefer variety of topic and place.

Return ONLY minified JSON: {"picks":[<numbers>]} with at most ${MAX_STORIES} numbers, best first. If nothing qualifies, {"picks":[]}.`;

const WRITE_SYSTEM = `You write news for a printed children's morning newspaper. Each story you get comes with the real article text (or, when that wasn't available, just the feed teaser). Write it the way a good newspaper writes for kids: plain, specific, true.

${SAFETY}

For each story:
- headline: at most 8 words, concrete and specific (who/what did what). No puns, no exclamation marks.
- location: where it happened — "City, Country", "City, State", or just the country/region when no city is given. Never repeat a word ("Turkey, Turkey" is wrong — write "Turkey").
- blurb: 2-3 short sentences a 7-year-old can read. Lead with the most surprising concrete fact. Include at least two specific details FROM THE ARTICLE (a number, a name, a place, what exactly was found or built). State status accurately — if something was proposed, voted on, or is being tested, say so; don't present it as finished.
- wonder: one extra true detail FROM THE ARTICLE that makes it more interesting, as a plain sentence. If the article has no extra detail worth adding, use "". Do NOT bring in general trivia from outside the article.
- bands: which of "4-6","7-9","10-12" can follow it.

Never invent details that aren't in the text. Never pad with feel-good filler — banned: "amazing", "incredible", "magical", "super", "awesome", "Did you know", "forever", "helping everyone", "making the world a better place", and sentences that only say the story is good or exciting. If a story has too little real information to write 2 specific sentences, or turns out not to be kid-safe, leave it out.

Return ONLY minified JSON: {"items":[{"story","headline","location","blurb","wonder","bands"}]} where "story" is the story number you wrote it from. No prose, no markdown. If nothing works, {"items":[]}.`;

const CHECK_SYSTEM = `You are the fact-checker for a children's newspaper. For each numbered draft you get the source text it was written from. Check every claim in the draft's headline, location, blurb and wonder against that source text.

A draft PASSES only if every specific (numbers, names, places, dates, what happened, and its status — proposed vs done, tested vs proven) is supported by the source text, and it is kid-safe. Minor simplification for children is fine; adding facts that aren't in the source is not.

Return ONLY minified JSON: {"checks":[{"story":<number>,"pass":true|false,"problem":"<short reason if it fails, else empty>"}]}.`;

async function ask(system: string, user: string, effort: "low" | "medium"): Promise<string> {
  // Opus 5.5 always thinks and that counts against max_tokens — stream with a
  // generous cap, and treat a truncated or refused reply as no result.
  const msg = await client()
    .messages.stream({
      model: MODEL,
      max_tokens: 32000,
      system,
      output_config: { effort },
      messages: [{ role: "user", content: user }],
    })
    .finalMessage();
  if (msg.stop_reason !== "end_turn") return "";
  return msg.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("")
    .trim();
}

function json(text: string): Record<string, unknown> | null {
  const a = text.indexOf("{");
  const b = text.lastIndexOf("}");
  if (a < 0 || b < 0) return null;
  try {
    return JSON.parse(text.slice(a, b + 1)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

const OUTLETS: Record<string, string> = {
  "goodnewsnetwork.org": "Good News Network",
  "news.mongabay.com": "Mongabay",
  "snexplores.org": "Science News Explores",
  "smithsonianmag.com": "Smithsonian",
  "nasa.gov": "NASA",
  "bbc.co.uk": "BBC",
  "bbc.com": "BBC",
  "nintendolife.com": "Nintendo Life",
  "pushsquare.com": "Push Square",
  "purexbox.com": "Pure Xbox",
  "gamesradar.com": "GamesRadar",
  "news.google.com": "Google News",
};

function outletName(url?: string): string {
  if (!url) return "";
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const hit = Object.keys(OUTLETS).find((d) => host === d || host.endsWith(`.${d}`));
    return hit ? OUTLETS[hit] : host;
  } catch {
    return "";
  }
}

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** Drop "Turkey, Turkey" style repeats the model sometimes still writes. */
function tidyLocation(loc: string): string {
  const parts = loc.split(",").map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  for (const p of parts) if (!out.some((o) => o.toLowerCase() === p.toLowerCase())) out.push(p);
  return out.join(", ");
}

function parseItems(text: string): { story: number; item: LiveNewsEntry }[] {
  const items = json(text)?.items;
  if (!Array.isArray(items)) return [];
  const out: { story: number; item: LiveNewsEntry }[] = [];
  for (const raw of items) {
    const o = raw as Record<string, unknown>;
    const headline = str(o.headline);
    const blurb = str(o.blurb);
    if (!headline || !blurb) continue;
    const bands = Array.isArray(o.bands)
      ? (o.bands.filter((b) => BANDS.includes(b as AgeBand)) as AgeBand[])
      : [];
    out.push({
      story: Number(o.story),
      item: {
        headline,
        location: tidyLocation(str(o.location)),
        blurb,
        wonder: str(o.wonder),
        bands: bands.length ? bands : ["7-9", "10-12"],
      },
    });
  }
  return out;
}

/**
 * Pick and write today's kid-safe stories from raw headlines. Returns [] on any
 * failure (no key, API error, bad JSON) — news never falls back to made-up text.
 */
export async function rewriteKidSafe(
  headlines: RawHeadline[],
  hint?: string,
): Promise<LiveNewsEntry[]> {
  if (!process.env.ANTHROPIC_API_KEY || headlines.length === 0) return [];
  const note = hint ? `\n\nFEED NOTE: ${hint}` : "";
  try {
    const list = headlines
      .map((h, i) => `${i + 1}. ${h.title}${h.summary ? ` — ${h.summary}` : ""}`)
      .join("\n");
    const picks = json(await ask(PICK_SYSTEM + note, `Today's headlines:\n\n${list}`, "low"))?.picks;
    const chosen = (Array.isArray(picks) ? picks : [])
      .map((n) => headlines[Number(n) - 1])
      .filter((h): h is RawHeadline => !!h)
      .slice(0, MAX_STORIES);
    if (!chosen.length) return [];

    const texts = await Promise.all(chosen.map((h) => (h.link ? fetchArticleText(h.link) : "")));
    const stories = chosen
      .map((h, i) =>
        [
          `### Story ${i + 1}: ${h.title}`,
          texts[i] ? `ARTICLE TEXT:\n${texts[i]}` : `FEED TEASER ONLY:\n${h.summary || "(none)"}`,
        ].join("\n"),
      )
      .join("\n\n");
    const written = parseItems(await ask(WRITE_SYSTEM + note, stories, "medium")).filter(
      (w) => Number.isInteger(w.story) && w.story >= 1 && w.story <= chosen.length,
    );
    if (!written.length) return [];

    // Fact-check every draft against the text it was written from; drop failures.
    const drafts = written
      .map((w) => {
        const src = texts[w.story - 1] || chosen[w.story - 1].summary || "(none)";
        return `### Draft ${w.story}\nDRAFT: ${JSON.stringify(w.item)}\nSOURCE TEXT:\n${src}`;
      })
      .join("\n\n");
    const checks = json(await ask(CHECK_SYSTEM, drafts, "medium"))?.checks;
    const verdict = new Map<number, boolean>();
    if (Array.isArray(checks)) {
      for (const c of checks as Record<string, unknown>[]) {
        verdict.set(Number(c.story), c.pass === true);
        if (c.pass !== true) console.warn("[news] fact-check dropped story", c.story, c.problem);
      }
    }
    return written
      .filter((w) => verdict.get(w.story) === true) // unchecked counts as failed
      .map((w) => {
        const h = chosen[w.story - 1];
        return {
          ...w.item,
          source: {
            title: h.title,
            url: h.link,
            outlet: outletName(h.link),
            fullText: !!texts[w.story - 1],
          },
        };
      });
  } catch (e) {
    console.error("[news] rewrite failed:", e instanceof Error ? e.message : e);
    return [];
  }
}
