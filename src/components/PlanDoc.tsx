import { Fragment } from "react";

/** Minimal renderer for the marketing plan's markdown: headings, lists, quotes, bold/italic/code. */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g).map((t, i) =>
    t.startsWith("**") ? <strong key={i}>{t.slice(2, -2)}</strong>
    : t.startsWith("`") ? <code key={i} className="rounded bg-cream px-1 text-[0.85em]">{t.slice(1, -1)}</code>
    : t.startsWith("*") && t.length > 2 ? <em key={i}>{t.slice(1, -1)}</em>
    : <Fragment key={i}>{t}</Fragment>,
  );
}

export function PlanDoc({ md }: { md: string }) {
  const out: React.ReactNode[] = [];
  let list: { ordered: boolean; items: React.ReactNode[] } | null = null;
  const flush = () => {
    if (!list) return;
    const Tag = list.ordered ? "ol" : "ul";
    out.push(<Tag key={out.length} className={`my-2 space-y-1 pl-5 text-sm text-ink ${list.ordered ? "list-decimal" : "list-disc"}`}>{list.items.map((x, i) => <li key={i}>{x}</li>)}</Tag>);
    list = null;
  };
  for (const raw of md.split("\n")) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)/);
    const num = line.match(/^\s*\d+\.\s+(.*)/);
    if (bullet || num) {
      const ordered = !!num;
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] }; }
      list.items.push(inline((bullet ?? num)![1]));
      continue;
    }
    flush();
    if (!line.trim()) continue;
    const h = line.match(/^(#{1,3})\s+(.*)/);
    if (h) {
      const cls = h[1].length === 1 ? "font-display text-2xl text-ink mt-2" : h[1].length === 2 ? "font-display text-xl text-ink mt-6" : "text-sm font-bold uppercase tracking-wide text-ink-soft mt-4";
      out.push(<h3 key={out.length} className={cls}>{inline(h[2])}</h3>);
    } else if (line.startsWith(">")) {
      out.push(<blockquote key={out.length} className="my-2 border-l-2 border-rule pl-3 text-sm text-ink-soft">{inline(line.replace(/^>\s?/, ""))}</blockquote>);
    } else if (/^---+$/.test(line)) {
      out.push(<hr key={out.length} className="my-4 border-rule" />);
    } else {
      out.push(<p key={out.length} className="my-2 text-sm text-ink">{inline(line)}</p>);
    }
  }
  flush();
  return <div>{out}</div>;
}
