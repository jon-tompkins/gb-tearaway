export interface RawHeadline {
  title: string;
  summary: string;
}

function decode(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

/**
 * Fetch and parse an RSS/Atom feed into the top `limit` items (title + summary).
 * Dependency-free (regex) — good enough for well-formed news feeds.
 */
export async function fetchHeadlines(url: string, limit = 14): Promise<RawHeadline[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "BackOfTheBox/1.0 (kid newspaper)" },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const out: RawHeadline[] = [];
  for (const block of items) {
    const title = tag(block, "title");
    const summary = tag(block, "description") || tag(block, "summary");
    if (title) out.push({ title, summary: summary.slice(0, 500) });
    if (out.length >= limit) break;
  }
  return out;
}
