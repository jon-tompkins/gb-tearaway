/**
 * Write the homepage difficulty-demo mazes.
 * Run: npx tsx scripts/render-difficulty-demo.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { bandFromDifficulty } from "../src/lib/difficulty";
import { DIFFICULTY_DEMO_FRAMES, DIFFICULTY_DEMO_SEED, fitDemoSvg } from "../src/lib/difficultyDemo";
import { generateMaze, mazeToSvg } from "../src/lib/puzzles/maze";

mkdirSync("public/difficulty-demo", { recursive: true });

for (const frame of DIFFICULTY_DEMO_FRAMES) {
  const maze = generateMaze(DIFFICULTY_DEMO_SEED, bandFromDifficulty(frame.level), frame.level);
  if (maze.cols !== frame.cols || maze.rows !== frame.rows) {
    throw new Error(`Level ${frame.level} is ${maze.cols}×${maze.rows}, expected ${frame.cols}×${frame.rows}`);
  }
  const svg = fitDemoSvg(mazeToSvg(maze, { showPath: false }));
  const viewBox = `viewBox="0 0 ${frame.width} ${frame.height}"`;
  if (!svg.includes(viewBox)) {
    throw new Error(`Level ${frame.level} SVG is missing ${viewBox}`);
  }
  writeFileSync(`public/difficulty-demo/maze-${frame.level}.svg`, svg);
  console.log(`maze-${frame.level}.svg`, `${maze.cols}×${maze.rows}`, `${svg.length} bytes`);
}
