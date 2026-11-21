/**
 * Homepage difficulty demo. Frames are real mazes from generateMaze + mazeToSvg,
 * written to public/difficulty-demo by scripts/render-difficulty-demo.ts.
 * Levels 3, 7, 11, and 16 match the printed size steps (10×13 up to 34×45).
 */
export const DIFFICULTY_DEMO_CAPTION =
  "You choose the starting level, and you can raise any card later.";

export const DIFFICULTY_DEMO_SEED = 0x5eed;

/** Position of a 1–20 level along the dial, as a percentage string. */
export function dialPercent(level: number): string {
  return (((level - 1) / 19) * 100).toFixed(3);
}

export const DIFFICULTY_DEMO_FRAMES = [
  { level: 3, cols: 10, rows: 13, width: 352, height: 454, src: "/difficulty-demo/maze-3.svg" },
  { level: 7, cols: 17, rows: 22, width: 352, height: 452, src: "/difficulty-demo/maze-7.svg" },
  { level: 11, cols: 25, rows: 33, width: 337, height: 441, src: "/difficulty-demo/maze-11.svg" },
  { level: 16, cols: 34, rows: 45, width: 352, height: 462, src: "/difficulty-demo/maze-16.svg" },
] as const;

export type DifficultyDemoFrame = (typeof DIFFICULTY_DEMO_FRAMES)[number];

/** Same adjustment the printer makes so the grid is not stretched. */
export function fitDemoSvg(svg: string): string {
  return svg.replace(' preserveAspectRatio="none"', "");
}
