import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("help tucks for the demo card and the footer, and setup keeps room under Cancel", () => {
  const chat = read("src/components/SupportChat.tsx");
  assert.match(chat, /new IntersectionObserver/);
  assert.match(chat, /new MutationObserver/);
  assert.match(chat, /\[data-help-clear\], footer/);
  assert.match(chat, /!open && !tucked/);

  const demo = read("src/components/DifficultyDemo.tsx");
  assert.match(demo, /data-help-clear/);
  assert.match(demo, /flex justify-start/);
  assert.equal(demo.includes("pb-24"), false);

  const setup = read("src/app/app/setup/SetupClient.tsx");
  assert.match(setup, /className="mx-auto max-w-5xl space-y-6 pb-24"/);
  assert.match(setup, /data-help-clear/);
  assert.match(setup, />Cancel</);
  assert.match(setup, /Create page/);
});
