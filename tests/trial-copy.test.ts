import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("homepage no longer says first month", () => {
  const home = read("src/app/page.tsx");
  assert.equal(home.toLowerCase().includes("first month"), false);
  assert.equal(home.includes("Free for a month"), false);
  assert.match(home, /30 days free, no card needed\./);
  assert.match(home, /30 days free\. No card needed during your trial\. Pick a plan whenever you.re ready, and nothing is charged until the trial ends\./);
});

test("homepage hero headline and primary button", () => {
  const home = read("src/app/page.tsx");
  const hero = home.slice(home.indexOf("<h1"), home.indexOf("See Modules"));
  assert.match(hero, /A page you can grow with your kid\./);
  assert.equal(hero.includes("A new puzzle page for your kid, every morning."), false);
  assert.equal(hero.includes("Made for your kid. Weather for your town."), false);
  assert.match(
    hero,
    /Start with Easier, Medium, or Harder, then dial each card up or down as they grow — a 1–20 control on every puzzle\. Kid-safe news, checked against the source\. Add your ZIP for today's weather\. 30 days free, no card needed\./,
  );
  assert.match(hero, /<GetStartedButton className="btn-primary" label="Start 30 days free" \/>/);
  assert.equal(hero.includes("callbackUrl"), false);
});

test("faq, terms, and landing pages use the 30-day no-card wording", () => {
  const faq = read("src/lib/faq.ts");
  assert.equal(faq.toLowerCase().includes("first month"), false);
  assert.match(faq, /Your first 30 days are free, and you don't need a card during the trial\./);

  const terms = read("src/app/terms/page.tsx");
  assert.equal(terms.toLowerCase().includes("first month"), false);
  assert.match(terms, /30 days free, starting the first time you open the app while signed in/);
  assert.match(terms, /49 hours/);
  assert.match(terms, /3 more days/);

  for (const path of ["src/app/lp/a/page.tsx", "src/app/lp/b/page.tsx", "src/app/lp/c/page.tsx"]) {
    const page = read(path);
    assert.equal(page.includes("Free for a month"), false, path);
    assert.match(page, /30 days free, no card needed/, path);
  }
});
