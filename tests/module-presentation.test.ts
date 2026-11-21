import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { SAMPLE_NEWS } from "../src/lib/content/sampleNews";
import { moduleExample } from "../src/lib/moduleExample";
import { MODULE_CATALOG, STARTER_MODULE_IDS, moduleById } from "../src/lib/modules";
import type { ModuleId } from "../src/lib/types";

const read = (path: string) => readFileSync(path, "utf8");

test("starter row is nine real modules, and play/words sit in their catalog groups", () => {
  assert.equal(STARTER_MODULE_IDS.length, 9);
  assert.equal(new Set(STARTER_MODULE_IDS).size, 9);
  for (const id of STARTER_MODULE_IDS) moduleById(id);

  const at = (id: ModuleId) => MODULE_CATALOG.findIndex((m) => m.id === id);
  for (const id of ["logicgrid", "cryptogram", "numbercross"] as const) {
    assert.equal(moduleById(id).category, "play");
    assert.ok(at(id) < at("word"), `${id} belongs with the play modules`);
  }
  for (const id of ["tonguetwister", "scramble"] as const) {
    assert.equal(moduleById(id).category, "words");
    assert.ok(at(id) > at("spanish") && at(id) < at("planes"), `${id} belongs with the word modules`);
  }
});

test("catalog blurbs drop shared QR lines, and country tiles are not copies of each other", () => {
  for (const mod of MODULE_CATALOG) {
    assert.equal(/scan the qr/i.test(mod.blurb), false, mod.id);
  }
  const sequence = moduleById("sequence").blurb;
  assert.equal(sequence.includes("Difficulty scales"), false);
  assert.match(sequence, /The parent sets how tricky/);

  const countries = ["country_all", "country_eu", "country_af", "country_asia_oce", "country_americas"] as const;
  const blurbs = countries.map((id) => moduleById(id).blurb);
  assert.equal(new Set(blurbs).size, blurbs.length);
  for (const blurb of blurbs) {
    assert.equal(blurb.includes("outline-only"), false);
    assert.ok(blurb.length < 140, blurb);
  }
});

test("each news module has its own sample story, and world records lead with the label", () => {
  assert.ok(SAMPLE_NEWS.length >= 5);
  const headlines = (["news_world", "news_national", "news_city", "news_tech", "news_gamer"] as const).map(
    (id) => moduleExample(id).text?.[0],
  );
  assert.equal(headlines.every((h) => typeof h === "string" && h.length > 0), true);
  assert.equal(new Set(headlines).size, headlines.length);
  assert.equal(headlines.includes("Class builds a robot that waters plants"), true);
  assert.equal(headlines.includes("Library opens a video-game hour"), true);
  const gamer = moduleExample("news_gamer").text?.join(" ") ?? "";
  assert.match(gamer, /video game/i);

  const record = moduleExample("records").text?.[0] ?? "";
  assert.match(record, /^World record · /);
});

test("homepage, module pages, and setup use the parent-set difficulty wording", () => {
  const home = read("src/app/page.tsx");
  const hero = home.slice(home.indexOf("<h1"), home.indexOf("See Modules"));
  assert.match(hero, /A page you can grow with your kid\./);
  assert.match(hero, /dial each card up or down as they grow — a 1–20 control on every puzzle/);
  assert.equal(hero.includes("Made for your kid. Weather for your town."), false);
  assert.equal(home.includes("tuned to your kid"), false);
  assert.match(home, /You set the difficulty\./);
  assert.match(home, /modules to build with/);
  assert.equal(home.includes("cards to build with"), false);
  assert.match(home, /Pick the modules/);
  assert.equal(home.includes("Pick the cards"), false);
  assert.match(home, /Start with these/);
  assert.equal((home.match(/label="Start 30 days free"/g) ?? []).length, 3);
  assert.match(home, /flex-wrap/);
  assert.match(home, /whitespace-nowrap/);
  assert.match(home, /signedInHref="\/app\/setup"/);
  assert.equal(home.includes(">Get started<"), false);
  assert.match(read("src/app/layout.tsx"), /The parent sets the difficulty\./);
  assert.equal(read("src/app/layout.tsx").includes("Difficulty-tuned"), false);

  const detail = read("src/app/modules/[id]/page.tsx");
  assert.match(detail, /The parent sets the difficulty\./);
  assert.equal(detail.includes("tuned to their age"), false);
  assert.match(detail, /signedInHref="\/app\/setup"/);
  assert.match(detail, /Start 30 days free/);
  assert.equal(detail.includes('href="/app"'), false);
  assert.match(detail, /scans the QR code on the page to check/);

  const browse = read("src/app/modules/page.tsx") + read("src/app/modules/ModulesBrowser.tsx");
  assert.match(browse, /buildExamples/);
  assert.match(browse, /signedInHref="\/app\/setup"/);
  assert.match(browse, /Start 30 days free/);
  assert.match(browse, /category\.name/);
  assert.equal(browse.includes("Create {NOUN"), false);

  const setup = read("src/app/app/setup/SetupClient.tsx");
  assert.match(setup, /window\.scrollTo\(0, 0\)/);
  assert.match(setup, /Each module also has a 1–20 dial you can raise later\./);
  assert.match(setup, /A mix is a head start/);
  assert.match(setup, /const needsZip = picked\.includes\("weather"\)/);
  assert.equal(setup.includes("news_national"), false);
  assert.equal(setup.includes("news_world"), false);
  assert.match(setup, /<h3 className="font-display text-base text-ink">\{category\.name\}<\/h3>/);
});
