"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppNav";

import { ALL_PUZZLE_KINDS, PUZZLE_KINDS, perSheet, type PuzzleKind } from "@/lib/booklet";

export default function BookletPage() {
  const [kinds, setKinds] = useState<PuzzleKind[]>(ALL_PUZZLE_KINDS);
  const [layout, setLayout] = useState<"full" | "half">("full");
  const [pages, setPages] = useState(25);
  const [d, setD] = useState(6);
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [binder, setBinder] = useState(true);
  const [duplex, setDuplex] = useState(true);
  const [answers, setAnswers] = useState(true);

  const qs = useMemo(
    () =>
      new URLSearchParams({
        kinds: kinds.join(","),
        layout,
        pages: String(pages),
        d: String(d),
        seed: String(seed),
        binder: binder ? "1" : "0",
        duplex: duplex ? "1" : "0",
        answers: answers ? "1" : "0",
      }).toString(),
    [kinds, layout, pages, d, seed, binder, duplex, answers],
  );

  const puzzleCount = Array.from({ length: pages }, (_, i) => perSheet(kinds[i % kinds.length], layout)).reduce((a, b) => a + b, 0);

  const pill = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm font-semibold transition ${on ? "border-ink bg-ink text-cream" : "border-rule bg-paper text-ink-soft hover:border-ink/40"}`;

  return (
    <AppShell
      title="Puzzle booklet"
      subtitle="Print a stack of puzzle pages with no headers. Punch them for a binder or staple them into a booklet."
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="card space-y-5">
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Puzzles</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setKinds(kinds.length === ALL_PUZZLE_KINDS.length ? [PUZZLE_KINDS[0].id] : ALL_PUZZLE_KINDS)} className={pill(kinds.length === ALL_PUZZLE_KINDS.length)}>
                All puzzles
              </button>
              {PUZZLE_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() =>
                    setKinds(kinds.includes(k.id) ? (kinds.length > 1 ? kinds.filter((x) => x !== k.id) : kinds) : [...kinds, k.id])
                  }
                  className={pill(kinds.includes(k.id))}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">Puzzles per sheet</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setLayout("full")} className={pill(layout === "full")}>
                Standard
              </button>
              <button type="button" onClick={() => setLayout("half")} className={pill(layout === "half")}>
                Doubled up
              </button>
            </div>
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Sheets: {pages}
            </span>
            <input type="range" min={1} max={60} value={pages} onChange={(e) => setPages(Number(e.target.value))} className="w-full" />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-ink-soft">
              Difficulty: {d} (1 easiest, 20 hardest)
            </span>
            <input type="range" min={1} max={20} value={d} onChange={(e) => setD(Number(e.target.value))} className="w-full" />
          </label>
          <div className="space-y-2 text-sm text-ink">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={binder} onChange={(e) => setBinder(e.target.checked)} />
              Extra margin for a 3-hole punch
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={duplex} onChange={(e) => setDuplex(e.target.checked)} />
              Printing double-sided (margin alternates sides)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={answers} onChange={(e) => setAnswers(e.target.checked)} />
              Answer pages at the back
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`/api/booklet?${qs}&format=pdf`} className="btn-primary">
              Download PDF
            </a>
            <a href={`/api/booklet?${qs}&format=print`} target="_blank" rel="noreferrer" className="btn-secondary">
              Print
            </a>
            <button type="button" onClick={() => setSeed(Math.floor(Math.random() * 1_000_000))} className="btn-secondary">
              Shuffle
            </button>
          </div>
          <p className="text-xs text-ink-soft">
            Big puzzles (mazes, word finds, crosswords…) get a full sheet each; smaller ones (sudoku, battleship, logic grids…) go two to a sheet. Doubled up halves the size again.
          </p>
          <p className="text-xs text-ink-soft">
            {puzzleCount} puzzles on {pages} sheets
            {answers ? ", plus answer pages" : ""}. For a booklet, print double-sided
            (flip on the long edge) and staple at the left.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-rule bg-paper">
          <iframe key={qs} title="Booklet preview" src={`/api/booklet?${qs}&format=html`} className="h-[80vh] w-full" />
        </div>
      </div>
    </AppShell>
  );
}
