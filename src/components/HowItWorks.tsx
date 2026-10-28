"use client";

import { useEffect, useState } from "react";
import { NOUN } from "@/lib/copy";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-cream">
        {n}
      </span>
      <div>
        <div className="font-semibold text-ink">{title}</div>
        <div className="text-sm leading-snug text-ink-soft">{children}</div>
      </div>
    </li>
  );
}

/** "How it works" button + modal: creating a dispatch, cards, modules that cycle, sizes. */
export function HowItWorks({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-sm font-semibold text-ink-soft underline-offset-2 hover:text-ink hover:underline ${className}`}
      >
        ⓘ How it works
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="How it works"
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[88vh] w-full max-w-xl flex-col rounded-t-2xl border border-rule bg-cream shadow-xl sm:rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-rule px-5 py-4">
              <h3 className="font-display text-lg text-ink">How Back of the Box works</h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="-mr-1 rounded-full px-2 py-1 text-xl leading-none text-ink-soft hover:bg-paper hover:text-ink"
              >
                ×
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto px-5 py-4">
              <ol className="space-y-4">
                <Step n={1} title={`Create a ${NOUN.one}`}>
                  Each {NOUN.one} is one child&rsquo;s daily page. Give it a name, an age, and when and where it should arrive.
                  Start from a template (Animal Lover, Big Gamer&hellip;) or build from scratch.
                </Step>
                <Step n={2} title="Lay out the page">
                  The page is an outline of a US Letter sheet with two columns. Tap a card to open it, or{" "}
                  <b>+ Add card</b> to place a new one. The outline never changes size, so the empty space is what you have left.
                </Step>
                <Step n={3} title="Card sizes">
                  Cards come in <b>½</b>, <b>1×</b> and <b>2×</b>. A 2× card is four times the height of a ½ card. Each column holds
                  8 units of space (½ = 1, 1× = 2, 2× = 4). Some modules, like mazes, need a bigger card.
                </Step>
                <Step n={4} title="Several modules in one card">
                  A card can hold up to 4 modules. They <b>take turns</b>: either in order (day 1, day 2, day 3&hellip;) or shuffled at
                  random. A card with Fun Fact, Records and History shows a different one each day.
                </Step>
                <Step n={5} title="Save, then activate">
                  New {NOUN.many} start <b>Inactive</b>, which means saved but not delivered. <b>Save &amp; activate</b> turns on daily
                  delivery. If you don&rsquo;t have a plan yet, it takes you to pick one.
                </Step>
              </ol>
              <p className="rounded-xl bg-paper px-3 py-2 text-xs text-ink-soft">
                Tip: use the preview at the bottom of the layout screen to see exactly what will print.
              </p>
            </div>
            <div className="border-t border-rule px-5 py-3 text-right">
              <button type="button" className="btn-primary text-sm" onClick={() => setOpen(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
