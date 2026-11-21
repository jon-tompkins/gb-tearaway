"use client";

import { useState } from "react";
import {
  DIFFICULTY_DEMO_CAPTION,
  DIFFICULTY_DEMO_FRAMES,
  dialPercent,
  type DifficultyDemoFrame,
} from "@/lib/difficultyDemo";

const FRAME_CLASS = [
  "difficulty-demo-f0",
  "difficulty-demo-f1",
  "difficulty-demo-f2",
  "difficulty-demo-f3",
] as const;

function MazeImg({
  frame,
  className,
  alt,
}: {
  frame: DifficultyDemoFrame;
  className: string;
  alt: string;
}) {
  return (
    // Prerendered printer SVG. next/image does not optimize this static file.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={frame.src}
      alt={alt}
      width={frame.width}
      height={frame.height}
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      draggable={false}
      className={className}
    />
  );
}

function StillMaze({ frame }: { frame: DifficultyDemoFrame }) {
  return (
    <figure className="min-w-0">
      <div className="relative aspect-[34/45] w-full overflow-hidden rounded-md border border-rule/80 bg-white">
        <MazeImg
          frame={frame}
          alt={`Maze at level ${frame.level}, ${frame.cols} by ${frame.rows} cells`}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
      <figcaption className="mt-1.5 text-center text-xs font-semibold text-ink">
        Level {frame.level}
        <span className="mt-0.5 block font-normal text-ink-soft">
          {frame.cols}×{frame.rows}
        </span>
      </figcaption>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-warm" aria-hidden="true">
        <div className="h-full rounded-full bg-stamp" style={{ width: `${dialPercent(frame.level)}%` }} />
      </div>
    </figure>
  );
}

/**
 * A maze card whose 1–20 dial steps through four printed levels.
 * CSS runs the loop. Reduced motion shows level 3 beside level 16, still.
 */
export function DifficultyDemo() {
  const [paused, setPaused] = useState(false);
  const before = DIFFICULTY_DEMO_FRAMES[0];
  const after = DIFFICULTY_DEMO_FRAMES[DIFFICULTY_DEMO_FRAMES.length - 1];

  return (
    <section
      aria-label="Difficulty demo showing a maze at levels 3, 7, 11, and 16"
      className="border-b border-rule/50"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:py-14 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-16">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-stamp">Difficulty · 1–20</p>
          <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">You pick the level</h2>
          <p className="mt-3 leading-relaxed text-ink-soft">
            These mazes come from the same generator as the printed page. The dial steps through levels 3, 7, 11, and 16.
          </p>
        </div>

        <div className="card mx-auto w-full max-w-sm">
          <p className="mono-meta text-ink-soft">Maze</p>

          <div className={paused ? "difficulty-demo-motion is-paused" : "difficulty-demo-motion"}>
            <div aria-hidden="true">
              <div className="relative mt-3 aspect-[34/45] w-full overflow-hidden rounded-md border border-rule/80 bg-white">
                {DIFFICULTY_DEMO_FRAMES.map((frame, i) => (
                  <MazeImg
                    key={frame.level}
                    frame={frame}
                    alt=""
                    className={`difficulty-demo-anim ${FRAME_CLASS[i]} absolute inset-0 h-full w-full object-contain`}
                  />
                ))}
              </div>
              <div className="relative mt-3 h-6">
                {DIFFICULTY_DEMO_FRAMES.map((frame, i) => (
                  <p
                    key={frame.level}
                    className={`difficulty-demo-anim ${FRAME_CLASS[i]} absolute inset-0 flex items-center justify-center whitespace-nowrap text-sm font-semibold text-ink`}
                  >
                    Level {frame.level} · {frame.cols}×{frame.rows} maze
                  </p>
                ))}
              </div>
              <div className="mt-2 select-none">
                <div className="flex items-center justify-between text-xs font-semibold tabular-nums text-ink-soft">
                  <span>1</span>
                  <span>20</span>
                </div>
                <div className="relative mt-1 h-6">
                  <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-warm" />
                  <div className="difficulty-demo-anim difficulty-demo-fill absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-stamp" />
                  <div className="difficulty-demo-anim difficulty-demo-thumb absolute top-1/2 z-10 h-4 w-4 rounded-full border-2 border-ink bg-cream shadow-sm" />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                aria-pressed={paused}
                aria-label={paused ? "Play the difficulty demo" : "Pause the difficulty demo"}
                onClick={() => setPaused((value) => !value)}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-rule bg-paper px-4 text-sm font-semibold text-ink hover:border-ink/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stamp"
              >
                {paused ? "Play" : "Pause"}
              </button>
            </div>
          </div>

          <div className="difficulty-demo-still">
            <div className="mt-3 grid grid-cols-2 gap-2 sm:gap-3">
              <StillMaze frame={before} />
              <StillMaze frame={after} />
            </div>
          </div>

          <p className="mt-4 border-t border-rule/60 pt-3 text-center text-sm font-medium leading-relaxed text-balance text-ink">
            {DIFFICULTY_DEMO_CAPTION}
          </p>
        </div>
      </div>
    </section>
  );
}
