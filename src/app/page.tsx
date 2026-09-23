import Link from "next/link";
import { AuthButton } from "@/components/AuthButton";

const PILLARS = [
  {
    title: "Paper only for kids",
    body: "No kid accounts, no kid app. COPPA-friendly by design — parents configure, kids tear.",
  },
  {
    title: "Educational play modules",
    body: "Word of the day, facts, mazes, sudoku, history — age-banded and swappable.",
  },
  {
    title: "58mm thermal ritual",
    body: "A short strip on the kitchen counter every morning. Personal. Physical.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-full bg-cream">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-ink text-[0.7rem] font-bold text-cream">
            T
          </span>
          <span className="masthead-display text-xl">Tearaway</span>
        </div>
        <div className="flex items-center gap-3">
          <AuthButton compact />
          <Link href="/app" className="text-sm font-semibold text-ink-soft hover:text-ink">
            Open dispatch →
          </Link>
        </div>
      </header>

      <section className="hero-grid border-y border-rule/50">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-stamp">
              Morning ritual · screen-free
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl">
              Every morning, something fun and a little smart waits for your kid on paper.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Tearaway is a tiny thermal strip — personalized, age-tuned, printed in the kitchen.
              Parents set the modules. Kids get the tear-off. Built by a dad and kid who wanted less
              tablet and more breakfast curiosity.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/app/setup" className="btn-primary">
                Set up your dispatch
              </Link>
              <Link href="/app" className="btn-secondary">
                Peek at today’s dispatch
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-soft">
              Local demo — no signup. Store lives in <code className="text-xs">data/store.json</code>.
            </p>
          </div>

          <div className="mx-auto w-full max-w-[300px]">
            <div className="strip-shell paper-grain px-4 py-4 text-ink shadow-xl">
              <div className="rule-double pb-2 text-center">
                <div className="masthead-display text-xl">Tearaway Times</div>
                <div className="mt-1 text-[0.7rem] font-semibold tracking-[0.16em]">For Sam</div>
                <div className="mono-meta mt-1 text-ink-soft">Wednesday · Sep 16</div>
              </div>
              <div className="border-b border-dashed border-rule py-2.5">
                <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-stamp">
                  Word of the Day
                </div>
                <p className="mt-1 text-sm font-semibold">PERSIST · per-SIST · verb</p>
                <p className="text-sm leading-snug text-ink-soft">
                  To keep going even when something is hard.
                </p>
              </div>
              <div className="border-b border-dashed border-rule py-2.5">
                <div className="text-[0.65rem] font-bold uppercase tracking-[0.16em] text-stamp">
                  Fun Fact
                </div>
                <p className="mt-1 text-sm leading-snug">
                  Octopuses have three hearts and blue blood.
                </p>
              </div>
              <div className="py-2.5 text-center">
                <div className="mx-auto mb-2 flex h-24 w-28 items-center justify-center rounded border border-ink/20 bg-white/40 text-[0.65rem] text-ink-soft">
                  maze · 8×10
                </div>
                <div className="perf-line mx-auto w-4/5" />
                <div className="mt-2 text-[0.65rem] font-bold tracking-[0.2em] text-stamp">
                  TEAR HERE
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14">
        <h2 className="font-display text-2xl text-ink sm:text-3xl">Not another family inbox</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Tearaway leans educational play — puzzles, words, and age targeting — with room for
          packs later. Kids are profiles, not users.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {PILLARS.map((p) => (
            <article key={p.title} className="card">
              <h3 className="font-display text-lg text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-rule/50 bg-warm/40">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-4 py-12 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl text-ink">Ready for the first print?</h2>
            <p className="mt-1 text-ink-soft">
              Create a kid profile, pick modules, preview the 58mm strip.
            </p>
          </div>
          <Link href="/app/setup" className="btn-primary shrink-0">
            Set up your dispatch
          </Link>
        </div>
      </section>

      <footer className="px-4 py-8 text-center text-xs text-ink-soft">
        Tearaway · parent demo · built by Jonto with his son
      </footer>
    </div>
  );
}
