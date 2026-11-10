import { LpHeader, Start, Sample, Puzzle, noIndex } from "../shared";

export const metadata = { ...noIndex, title: "Back of the Box" };

const POINTS = [
  { e: "📄", t: "It's just paper", b: "Nothing to log into or click. They get a page and a pen." },
  { e: "☕", t: "A morning habit", b: "A new page arrives every morning, so there's always something to look forward to." },
  { e: "🎚️", t: "Just the right level", b: "You choose the difficulty, and you can change it any time." },
];

/** Option C — for the family member setting it up for someone they love. */
export default function C() {
  return (
    <div className="min-h-full bg-cream">
      <LpHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20">
        <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div>
            <p className="text-lg font-bold uppercase tracking-[0.18em] text-stamp">For someone you love</p>
            <h1 className="mt-2 font-display text-5xl leading-tight text-ink">Give them something good to do with their morning coffee.</h1>
            <p className="mt-4 text-2xl text-ink-soft">You set it up once. A fresh puzzle page shows up every day, ready to print.</p>
            <div className="mt-8"><Start label="Set it up for them" /></div>
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
          <Puzzle id="crossword" label="Crosswords" />
          <Puzzle id="sudoku" label="Sudoku" />
        </section>
        <div className="mt-10 text-center"><Sample /></div>
      </main>
    </div>
  );
}
