import { LpHeader, Start, Sample, Puzzle, noIndex } from "../shared";

export const metadata = { ...noIndex, title: "Back of the Box" };

/** Option B — the puzzles themselves are the page. Show, don't tell. */
export default function B() {
  return (
    <div className="min-h-full bg-cream">
      <LpHeader />
      <main className="mx-auto max-w-5xl px-4 pb-20">
        <h1 className="text-center font-display text-5xl leading-tight text-ink sm:text-6xl">Which puzzles do you like?</h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-2xl text-ink-soft">We'll put your favorites on one page and bring it to you every morning.</p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Puzzle id="crossword" label="Crosswords" />
          <Puzzle id="sudoku" label="Sudoku" />
          <Puzzle id="wordfind" label="Word finds" />
          <Puzzle id="logicgrid" label="Brain teasers" />
        </div>
        <p className="mt-6 text-center text-xl text-ink-soft">…plus poems, quotes, history, trivia and the weather.</p>
        <div className="mt-8 text-center"><Start label="Choose mine" /></div>
        <p className="mt-4 text-center text-xl text-ink-soft">Free for a month. Printed at home.</p>
        <div className="mt-8 text-center"><Sample /></div>
      </main>
    </div>
  );
}
