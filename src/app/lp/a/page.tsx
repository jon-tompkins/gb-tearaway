import { LpHeader, Start, Sample, noIndex } from "../shared";

export const metadata = { ...noIndex, title: "Back of the Box" };

const STEPS = [
  { e: "👆", t: "Pick what you like" },
  { e: "📧", t: "It arrives each morning" },
  { e: "🖨️", t: "Print it. Enjoy it." },
];

/** Option A — one big picture, one button. */
export default function A() {
  return (
    <div className="min-h-full bg-cream">
      <LpHeader />
      <main className="mx-auto max-w-4xl px-4 pb-20 text-center">
        <h1 className="font-display text-5xl leading-tight text-ink sm:text-6xl">A fresh puzzle page, every morning.</h1>
        <p className="mx-auto mt-4 max-w-xl text-2xl text-ink-soft">On paper. No screen needed.</p>
        <img src="/dispatch-preview.png" alt="A Back of the Box puzzle page with a crossword, a maze, a joke and the weather" className="mx-auto mt-8 w-full max-w-md rounded-2xl border border-rule shadow-xl" />
        <div className="mt-10"><Start /></div>
        <p className="mt-4 text-xl text-ink-soft">Free for a month.</p>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={s.t} className="rounded-3xl border border-rule bg-paper p-6">
              <div className="text-6xl">{s.e}</div>
              <p className="mt-3 text-2xl font-semibold text-ink">{i + 1}. {s.t}</p>
            </div>
          ))}
        </div>
        <div className="mt-10"><Sample /></div>
      </main>
    </div>
  );
}
