import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "node:test";
import { bandFromDifficulty } from "../src/lib/difficulty";
import {
  DIFFICULTY_DEMO_CAPTION,
  DIFFICULTY_DEMO_FRAMES,
  DIFFICULTY_DEMO_SEED,
  dialPercent,
  fitDemoSvg,
} from "../src/lib/difficultyDemo";
import { generateMaze, mazeToSvg } from "../src/lib/puzzles/maze";
import { DifficultyDemo } from "../src/components/DifficultyDemo";

test("difficulty demo renders the caption", () => {
  const html = renderToStaticMarkup(createElement(DifficultyDemo));
  assert.equal(html.includes(DIFFICULTY_DEMO_CAPTION), true);
  assert.equal(html.split(DIFFICULTY_DEMO_CAPTION).length - 1, 1);
  assert.match(html, /aria-label="Difficulty demo showing a maze at levels 3, 7, 11, and 16"/);
  assert.match(html, /aria-label="Pause the difficulty demo"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, />Pause</);
  for (const frame of DIFFICULTY_DEMO_FRAMES) {
    assert.equal(html.includes(frame.src), true, frame.src);
  }
});

test("difficulty demo mazes are printed generator output", () => {
  for (const frame of DIFFICULTY_DEMO_FRAMES) {
    const maze = generateMaze(DIFFICULTY_DEMO_SEED, bandFromDifficulty(frame.level), frame.level);
    assert.equal(maze.cols, frame.cols);
    assert.equal(maze.rows, frame.rows);
    const expected = fitDemoSvg(mazeToSvg(maze, { showPath: false }));
    const file = readFileSync(`public/difficulty-demo/maze-${frame.level}.svg`, "utf8");
    assert.equal(file, expected, `maze-${frame.level}.svg drifted; rerun scripts/render-difficulty-demo.ts`);
    assert.equal(file.includes(`viewBox="0 0 ${frame.width} ${frame.height}"`), true);
  }
});

test("difficulty dial stops match the 1–20 scale", () => {
  const css = readFileSync("src/app/globals.css", "utf8");
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  for (const frame of DIFFICULTY_DEMO_FRAMES) {
    assert.equal(css.includes(`${dialPercent(frame.level)}%`), true, frame.level.toString());
  }
});

test("homepage places the difficulty demo below the hero", () => {
  const home = readFileSync("src/app/page.tsx", "utf8");
  const headline = home.indexOf("Made for your kid. Weather for your town.");
  const demo = home.indexOf("<DifficultyDemo");
  const sample = home.indexOf('id="sample"');
  assert.ok(headline !== -1 && demo > headline && sample > demo);
});
