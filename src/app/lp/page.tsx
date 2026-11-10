import Link from "next/link";
import { noIndex } from "./shared";

export const metadata = { ...noIndex, title: "Landing options" };

const OPTS = [
  { href: "/lp/a", t: "A · One big picture", b: "Headline, the real page, three steps, one button. Least to read." },
  { href: "/lp/b", t: "B · Pick your puzzles", b: "The puzzles are the page. Tiles show real crosswords and sudoku." },
  { href: "/lp/c", t: "C · For someone you love", b: "Speaks to the family member setting it up. Photo and three reassurances." },
];

export default function LpIndex() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-4xl text-ink">Landing page options</h1>
      <p className="mt-2 text-lg text-ink-soft">Draft only. Not linked or indexed. All three send "Start" into the new builder at /app/build.</p>
      <div className="mt-6 space-y-3">
        {OPTS.map((o) => (
          <Link key={o.href} href={o.href} className="block rounded-2xl border border-rule bg-paper p-5 hover:border-ink/40">
            <p className="text-2xl font-semibold text-ink">{o.t}</p>
            <p className="mt-1 text-lg text-ink-soft">{o.b}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
