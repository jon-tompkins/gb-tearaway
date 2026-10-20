/**
 * Fetch a news article and pull out its body text (the <p> paragraphs).
 * The RSS teaser alone is a sentence or two, which is why rewrites of it read
 * as generic filler — the writer needs the real names, numbers and quotes.
 * Returns "" on any failure; callers fall back to the teaser.
 */
export async function fetchArticleText(url: string, maxChars = 5000): Promise<string> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; BackOfTheBox/1.0; +https://www.backofthebox.xyz) kid newspaper",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: ctl.signal,
      cache: "no-store",
    });
    if (!res.ok) return "";
    const html = (await res.text())
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<(nav|header|footer|aside|form|figure)[\s\S]*?<\/\1>/gi, " ");
    const paras: string[] = [];
    let len = 0;
    for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      const text = decodeEntities(m[1].replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
      // Skip bylines, captions, cookie banners and other short fragments.
      if (text.length < 60) continue;
      paras.push(text);
      len += text.length;
      if (len >= maxChars) break;
    }
    return paras.join("\n").slice(0, maxChars);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;|&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}
