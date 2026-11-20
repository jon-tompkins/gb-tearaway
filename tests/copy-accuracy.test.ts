import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

/** Product copy must not promise hometown news or mazes that level themselves. */
const BANNED = ["local stories", "harder as they grow"];

function filesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...filesUnder(full));
    else out.push(full);
  }
  return out;
}

test("src does not say local stories or harder as they grow", () => {
  const hits: string[] = [];
  for (const file of filesUnder("src")) {
    const lower = readFileSync(file, "utf8").toLowerCase();
    for (const phrase of BANNED) {
      if (lower.includes(phrase)) hits.push(`${file}: ${phrase}`);
    }
  }
  assert.deepEqual(hits, []);
});
