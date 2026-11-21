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
  assert.match(chat, /max-width: 639px/);
  assert.match(chat, /!hideFloat/);
  assert.match(chat, /export function openSupportChat/);

  const nav = read("src/components/AppNav.tsx");
  assert.match(nav, /openSupportChat/);
  assert.match(nav, /pathname === "\/app\/setup"/);
  assert.match(nav, /min-h-11 min-w-11/);
  assert.match(nav, /sm:hidden/);
  assert.match(nav, /flex-wrap/);
  assert.match(nav, /sm:flex-nowrap/);
  assert.equal(nav.includes("overflow-x-auto"), false);
  assert.match(nav, /min-h-dvh/);

  const layout = read("src/app/layout.tsx");
  assert.match(layout, /min-h-dvh/);
  assert.equal(layout.includes("h-full antialiased"), false);
  assert.equal(read("src/app/globals.css").includes("html, body { height: 100%; }"), false);

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
