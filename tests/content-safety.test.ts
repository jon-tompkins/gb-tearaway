import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  collectStaticKidContent,
  findContentViolations,
  parseDenylist,
} from "../src/lib/content/safetyScan";

const DENYLIST_PATH = path.join(process.cwd(), "src/lib/content/safety-denylist.txt");

function terms() {
  return parseDenylist(readFileSync(DENYLIST_PATH, "utf8"));
}

test("static banks, blurbs, and sample news stay inside the denylist", () => {
  const list = terms();
  assert.ok(list.length >= 20, "denylist should stay reviewable and non-empty");
  const hits = findContentViolations(collectStaticKidContent(), list);
  assert.deepEqual(
    hits,
    [],
    hits.map((h) => `${h.source}: “${h.term}” in “${h.excerpt}”`).join("\n"),
  );
});

test("a planted scary placeholder string fails the safety check", () => {
  const hits = findContentViolations(
    [
      {
        source: "planted",
        text: "TODO lorem ipsum (A real terrorist story about a stub headline",
      },
    ],
    terms(),
  );
  const found = new Set(hits.map((h) => h.term.toLowerCase()));
  for (const term of ["todo", "lorem", "terrorist", "stub", "(a real"]) {
    assert.ok(found.has(term), `expected the safety check to flag ${term}, got ${[...found].join(", ")}`);
  }
});

test("word-boundary matching leaves ordinary words alone", () => {
  const hits = findContentViolations(
    [{ source: "poem", text: "Falls on the stubble lea, and she said hello to the grapes." }],
    terms(),
  );
  assert.deepEqual(hits, []);
});
