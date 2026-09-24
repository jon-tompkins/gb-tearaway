"use client";

import { useMemo, useRef, useState } from "react";
import type { PrintJob, StripSection } from "@/lib/types";
import { LETTER_WIDTH_PX, STRIP_WIDTH_PX } from "@/lib/types";
import { mazeToSvg } from "@/lib/puzzles/maze";
import { sudokuToSvg } from "@/lib/puzzles/sudoku";

/** Rough vertical weight of a card, used to balance columns when the saved
 * layout doesn't assign columns itself (older dispatches). */
function sectionWeight(s: StripSection): number {
  if (s.kind === "maze" || s.kind === "sudoku" || s.kind === "wordfind" || s.kind === "dots") return 8;
  if (s.news?.length) return 2 + s.news.length * 5; // each story is several lines tall
  if (s.kind === "weather") return 5;
  const lines = (s.lines?.length ?? 0) + (s.answer ? 1 : 0);
  return Math.max(2, lines);
}

/** Split body cards into two print columns: honor each card's saved `column`
 * when the layout uses both, otherwise greedily balance by weight. */
function splitColumns(sections: StripSection[]): [StripSection[], StripSection[]] {
  const usesColumns = sections.some((s) => (s.column ?? 0) === 1);
  if (usesColumns) {
    return [
      sections.filter((s) => (s.column ?? 0) === 0),
      sections.filter((s) => (s.column ?? 0) === 1),
    ];
  }
  const a: StripSection[] = [];
  const b: StripSection[] = [];
  let wa = 0;
  let wb = 0;
  for (const s of sections) {
    if (wa <= wb) {
      a.push(s);
      wa += sectionWeight(s);
    } else {
      b.push(s);
      wb += sectionWeight(s);
    }
  }
  return [a, b];
}

function SectionBlock({
  section,
  showKeys,
}: {
  section: StripSection;
  showKeys: boolean;
}) {
  if (section.kind === "header") {
    return (
      <header className="rule-double mb-3 pb-2 text-center">
        <div className="masthead-display text-[1.4rem] leading-tight tracking-tight">
          {section.lines[0]}
        </div>
        <div className="mt-1.5 text-[0.78rem] font-semibold tracking-[0.14em]">
          {section.lines[1]}
        </div>
        <div className="mono-meta mt-1 text-ink-soft">{section.lines[2]}</div>
        <div className="mono-meta text-ink-soft/80">{section.lines[3]}</div>
      </header>
    );
  }

  if (section.kind === "footer") {
    return (
      <footer className="mt-2 pt-2 text-center">
        <div className="perf-line mb-2" />
        <div className="text-[0.72rem] font-bold tracking-[0.24em] text-stamp">TEAR HERE</div>
        <p className="mt-2 text-[0.68rem] leading-snug text-ink-soft">{section.lines[1]}</p>
        <p className="mt-1 text-[0.6rem] uppercase tracking-[0.16em] text-ink-soft/70">
          {section.lines[2]}
        </p>
      </footer>
    );
  }

  const svg =
    section.kind === "maze" && section.maze
      ? mazeToSvg(section.maze, { showPath: showKeys })
      : section.kind === "sudoku" && section.sudoku
        ? sudokuToSvg(section.sudoku, { showSolution: showKeys })
        : section.svg || null;

  return (
    <section className="border-b border-dashed border-rule py-2.5 last:border-0">
      <h3 className="mb-1 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-stamp">
        {section.title}
      </h3>
      {section.news?.length
        ? section.news.map((n, i) => (
            <div key={i} className="mb-1.5 last:mb-0">
              <p className="text-[0.82rem] font-bold leading-snug text-ink">{n.headline}</p>
              <p className="text-[0.76rem] leading-snug text-ink-soft">
                {n.location ? (
                  <span className="font-bold uppercase tracking-wide text-ink">
                    {n.location}
                    {" — "}
                  </span>
                ) : null}
                {n.blurb}
              </p>
            </div>
          ))
        : null}
      {section.lines.map((line, i) => (
        <p key={i} className="text-[0.84rem] leading-snug text-ink">
          {line}
        </p>
      ))}
      {section.answer ? (
        showKeys ? (
          <p className="mt-1 text-[0.84rem] font-semibold leading-snug text-stamp">
            Answer: {section.answer}
          </p>
        ) : (
          <p className="mt-1 text-[0.72rem] italic leading-snug text-ink-soft/70">
            Answer hidden — flip on Parent key to reveal.
          </p>
        )
      ) : null}
      {svg ? (
        <div
          className="mt-2 flex justify-center [&_svg]:max-w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : null}
    </section>
  );
}

export function StripPreview({
  job,
  emptyHint,
  showParentKeyToggle = true,
}: {
  job: PrintJob | null;
  emptyHint?: string;
  showParentKeyToggle?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showKeys, setShowKeys] = useState(false);
  const [busy, setBusy] = useState(false);

  const isLetter = job?.paperSize === "letter";
  const previewWidth = isLetter
    ? LETTER_WIDTH_PX
    : Math.min(job?.widthPx ?? STRIP_WIDTH_PX, STRIP_WIDTH_PX);

  const hasKeys = useMemo(
    () =>
      !!job?.sections.some(
        (s) => s.kind === "maze" || s.kind === "sudoku" || !!s.answer,
      ),
    [job],
  );

  const bodySections = useMemo(
    () => job?.sections.filter((s) => s.kind !== "header" && s.kind !== "footer") ?? [],
    [job],
  );
  const header = job?.sections.find((s) => s.kind === "header");
  const footer = job?.sections.find((s) => s.kind === "footer");
  const [colA, colB] = useMemo(() => splitColumns(bodySections), [bodySections]);

  async function downloadPng() {
    if (!ref.current || !job) return;
    setBusy(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(ref.current, {
        pixelRatio: 2,
        backgroundColor: "#f7f1e3",
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `back-of-the-box-${job.kidName.toLowerCase()}-${job.date}.png`;
      a.click();
    } catch (err) {
      console.error(err);
      window.alert("Couldn’t export PNG in this browser. Try Chrome or Edge.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full">
      <div
        className={`relative mx-auto flex w-full justify-center ${
          isLetter ? "max-w-[612px]" : "max-w-[384px]"
        }`}
      >
        <div
          ref={ref}
          className={`strip-shell paper-grain w-full px-3.5 py-3.5 ${
            isLetter ? "letter-shell" : ""
          }`}
          style={{ width: previewWidth }}
        >
          <div className="strip-curl" aria-hidden />
          {job ? (
            isLetter ? (
              <>
                {header ? <SectionBlock section={header} showKeys={showKeys} /> : null}
                <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                  {[colA, colB].map((col, ci) => (
                    <div key={ci} className="flex flex-col">
                      {col.map((s, i) => (
                        <SectionBlock key={`${s.id}-${i}`} section={s} showKeys={showKeys} />
                      ))}
                    </div>
                  ))}
                </div>
                {footer ? <SectionBlock section={footer} showKeys={showKeys} /> : null}
              </>
            ) : (
              job.sections.map((s, i) => (
                <SectionBlock key={`${s.id}-${i}`} section={s} showKeys={showKeys} />
              ))
            )
          ) : (
            <div className="px-2 py-10 text-center">
              <div className="masthead-display text-lg">Back of the Box</div>
              <p className="mt-3 text-sm text-ink-soft">
                {emptyHint ?? "Hit Print now to generate today’s morning strip."}
              </p>
              <div className="perf-line mx-auto mt-8 w-4/5" />
              <div className="mt-2 text-[0.65rem] font-bold tracking-[0.2em] text-stamp">
                TEAR HERE
              </div>
            </div>
          )}
        </div>
      </div>

      {job ? (
        <div
          className={`mx-auto mt-4 flex flex-wrap items-center justify-center gap-2 ${
            isLetter ? "max-w-[612px]" : "max-w-[384px]"
          }`}
        >
          <button type="button" onClick={downloadPng} disabled={busy} className="btn-secondary text-sm">
            {busy ? "Saving…" : "Download PNG"}
          </button>
          {showParentKeyToggle && hasKeys ? (
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-rule bg-paper/80 px-3 py-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                checked={showKeys}
                onChange={(e) => setShowKeys(e.target.checked)}
                className="accent-stamp"
              />
              Parent key
            </label>
          ) : null}
        </div>
      ) : null}
      {showKeys ? (
        <p
          className={`mx-auto mt-2 text-center text-xs text-ink-soft ${
            isLetter ? "max-w-[612px]" : "max-w-[384px]"
          }`}
        >
          Parent key is on-screen only. It is not part of the printed strip.
        </p>
      ) : null}
    </div>
  );
}
