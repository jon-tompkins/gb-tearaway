import Anthropic from "@anthropic-ai/sdk";
import type { AgeBand } from "../types";
import type { LiveNewsEntry } from "../content/news";
import type { RawHeadline } from "./rss";

const MODEL = "claude-haiku-4-5";
const BANDS: AgeBand[] = ["4-6", "7-9", "10-12"];

const SYSTEM = `You turn real news headlines into short, kid-safe news blurbs for a children's printed morning paper. You are the safety filter and the writer.

STRICT — DROP any item that touches: death, injury, violence, war, weapons, crime, terrorism, disasters/accidents, abuse, illness/medical, protests, elections/partisan politics, money/economy scandals, celebrities' private lives, or anything scary, sad, or adult. When unsure, drop it.

KEEP only genuinely wholesome, curiosity-sparking stories: science, space, nature, animals, discoveries, inventions/technology-for-good, sports achievements, art/culture, community kindness, records, and cool "how the world works" news.

For each KEPT item write, grounded in the real headline/summary (do NOT invent events or fake specifics):
- headline: <= 8 words, plain and fun
- location: "City, Country" or "City, State" if known, else a broad region ("Pacific Ocean", "Space")
- blurb: 2-3 short sentences a 7-year-old understands, factual to the real story
- wonder: one delightful true "did you know" fact related to it
- bands: which of "4-6","7-9","10-12" the story suits (array)

Return ONLY minified JSON: {"items":[{"headline","location","blurb","wonder","bands"}]}. No prose, no markdown. If nothing is appropriate, return {"items":[]}.`;

function parseItems(text: string): LiveNewsEntry[] {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) return [];
  let data: unknown;
  try {
    data = JSON.parse(text.slice(start, end + 1));
  } catch {
    return [];
  }
  const items = (data as { items?: unknown[] })?.items;
  if (!Array.isArray(items)) return [];
  const out: LiveNewsEntry[] = [];
  for (const raw of items) {
    const o = raw as Record<string, unknown>;
    const headline = typeof o.headline === "string" ? o.headline.trim() : "";
    const blurb = typeof o.blurb === "string" ? o.blurb.trim() : "";
    if (!headline || !blurb) continue;
    const bands = Array.isArray(o.bands)
      ? (o.bands.filter((b) => BANDS.includes(b as AgeBand)) as AgeBand[])
      : [];
    out.push({
      headline,
      location: typeof o.location === "string" ? o.location.trim() : "",
      blurb,
      wonder: typeof o.wonder === "string" ? o.wonder.trim() : "",
      bands: bands.length ? bands : ["7-9", "10-12"],
    });
  }
  return out;
}

/**
 * Rewrite raw headlines into kid-safe blurbs via Haiku. Returns [] on any
 * failure (missing key, API error, bad JSON) so callers fall back to the
 * static bank. Never throws.
 */
export async function rewriteKidSafe(
  headlines: RawHeadline[],
  hint?: string,
): Promise<LiveNewsEntry[]> {
  if (!process.env.ANTHROPIC_API_KEY || headlines.length === 0) return [];
  try {
    const client = new Anthropic();
    const list = headlines
      .map((h, i) => `${i + 1}. ${h.title}${h.summary ? ` — ${h.summary}` : ""}`)
      .join("\n");
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: hint ? `${SYSTEM}\n\nFEED NOTE: ${hint}` : SYSTEM,
      messages: [
        {
          role: "user",
          content: `Today's real headlines. Keep only the kid-safe ones and rewrite them:\n\n${list}`,
        },
      ],
    });
    const text = res.content
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("")
      .trim();
    return parseItems(text);
  } catch {
    return [];
  }
}
