import { LpHeader, Start, Sample, Puzzle, noIndex } from "../shared";

export const metadata = { ...noIndex, title: "Back of the Box" };

const POINTS = [
  { e: "📄", t: "Paper, not a screen", b: "They get a page and a pencil. Kids never need an account." },
  { e: "🌅", t: "New every morning", b: "A fresh page arrives each day, so there's always something to look forward to." },
  { e: "🎚️", t: "Just the right level", b: "Pick Easier, Medium or Harder, and change it any time." },
];

/** Option C — for the parent setting it up for their kid. */
export default function C() {
  return (
    <div className="min-h-full bg-cream">
      <LpHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-lg font-bold uppercase tracking-[0.18em] text-stamp">For your kid</p>
            <h1 className="mt-2 font-display text-5xl leading-tight text-ink">A fresh puzzle page for your kid, every morning.</h1>
            <p className="mt-4 text-2xl text-ink-soft">You set it up once. Mazes, puzzles and real kid-safe news show up every day, ready to print.</p>
            <div className="mt-8"><Start label="Set it up for my kid" /></div>
            <p className="mt-4 text-xl text-ink-soft">Free for a month.</p>
          </div>
          <img src="/dispatch-preview.png" alt="A Back of the Box puzzle page with a crossword, a maze, a joke and the weather" className="mx-auto w-full max-w-sm rounded-2xl border border-rule shadow-xl" />
        </section>
        <section className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {POINTS.map((p) => (
            <div key={p.t} className="rounded-3xl border border-rule bg-paper p-6">
              <div className="text-5xl">{p.e}</div>
              <h2 className="mt-3 text-2xl font-semibold text-ink">{p.t}</h2>
              <p className="mt-1 text-xl text-ink-soft">{p.b}</p>
            </div>
          ))}
        </section>
        <section className="mt-12 grid grid-cols-2 gap-5">
          <Puzzle id="maze" label="Mazes" />
          <Puzzle id="wordfind" label="Word finds" />
        </section>
        <div className="mt-10 text-center"><Sample /></div>
      </main>
    </div>
  );
}
