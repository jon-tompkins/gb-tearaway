// Build a static bank of kid-safe fun facts for the geography modules.
// Source = Wikipedia article text. Haiku drafts a fact + the verbatim sentence
// it relies on; we verify the sentence really is in the article, then Sonnet
// checks the fact against that sentence. Only passing facts are kept.
// Usage: node scripts/build-geo-facts.mjs [name ...]   (no args = everything)
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";

const OUT = "scripts/geo-facts.json";
const read = (f) => readFileSync(f, "utf8");
const names = (f, re) => [...read(f).matchAll(re)].map((m) => m[1]);
const states = names("src/lib/puzzles/states-data.ts", /\{ name: "([^"]+)", capital/g).map((n) => ({ name: n, kind: "state" }));
const countries = names("src/lib/puzzles/countries-data.ts", /\{ name: "([^"]+)", capital/g).map((n) => ({ name: n, kind: "country" }));
const TITLE = {
  "Türkiye": "Turkey", "DR Congo": "Democratic Republic of the Congo", Congo: "Republic of the Congo",
  "Ivory Coast": "Ivory Coast", Georgia: "Georgia (country)",
  Gambia: "The Gambia", Bahamas: "The Bahamas", "Timor-Leste": "East Timor",
};
const STATE_TITLE = { Georgia: "Georgia (U.S. state)", Washington: "Washington (state)", "New York": "New York (state)" };
const titleOf = (x) => (x.kind === "state" ? STATE_TITLE[x.name] : TITLE[x.name]) ?? x.name;
const keyOf = (x) => `${x.kind}:${x.name}`;
const all = [...states, ...countries];
const only = process.argv.slice(2);
const todo = only.length ? all.filter((x) => only.includes(keyOf(x))) : all;
const bank = existsSync(OUT) ? JSON.parse(read(OUT)) : {};

const norm = (s) => s.toLowerCase().replace(/[‘’“”]/g, "'").replace(/[^a-z0-9]+/g, " ").trim();

function claude(model, prompt) {
  return new Promise((resolve) => {
    const p = spawn("claude", ["-p", "--model", model, "--tools", "", "--output-format", "text"]);
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("close", () => resolve(out));
    p.stdin.end(prompt);
  });
}
const json = (t) => { try { return JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1)); } catch { return null; } };

// Wikipedia rate-limits hard: serialize fetches, back off on 429, cache to disk.
const CACHE = "/tmp/geo-wiki-cache";
import { mkdirSync } from "node:fs";
mkdirSync(CACHE, { recursive: true });
let wikiChain = Promise.resolve();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function wiki(title) {
  const f = `${CACHE}/${encodeURIComponent(title)}.txt`;
  if (existsSync(f)) return Promise.resolve(read(f));
  const run = wikiChain.then(async () => {
    for (let a = 0; a < 6; a++) {
      const u = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&format=json&titles=${encodeURIComponent(title)}`;
      const r = await fetch(u, { headers: { "User-Agent": "BackOfTheBox/1.0 (jon.tomp@gmail.com; kid geography facts)" } });
      const body = await r.text();
      if (r.ok && body.startsWith("{")) {
        const t = Object.values(JSON.parse(body).query.pages)[0]?.extract ?? "";
        if (t) writeFileSync(f, t);
        await sleep(1200);
        return t;
      }
      await sleep(5000 * (a + 1));
    }
    return "";
  });
  wikiChain = run.catch(() => {});
  return run;
}

const RULES = `Kid safety: no death, injury, war, weapons, crime, disasters, slavery, politics, religion disputes, disease or anything sad or scary. Pick something a 7-12 year old would find fun: a record, an animal, a food, a landmark, an invention, a quirky place name, a natural wonder.`;

async function one(x, attempt = 0) {
  const { name, kind } = x;
  const text = (await wiki(titleOf(x))).slice(0, 14000);
  if (text.length < 500) return { name, err: "no article" };
  const draft = json(await claude("haiku", `Write ONE fun fact about ${name} (a ${kind === "state" ? "US state" : "country"}) for a kid's newspaper, using ONLY the article text below.
${RULES}
Rules: max 22 words, plain words, no "Did you know". Every number, name and superlative (biggest, first, only, oldest...) must appear in the text. Do not use a superlative unless the text states it.
Reply with ONLY JSON: {"fact":"...","quote":"ONE sentence copied word-for-word from the article that supports the fact"}

ARTICLE:
${text}`));
  const again = (err) => (attempt < 2 ? one(x, attempt + 1) : { name, err });
  if (!draft?.fact || !draft?.quote) return again("bad draft");
  if (!norm(text).includes(norm(draft.quote))) return again("quote not in article");
  const chk = json(await claude("sonnet", `Fact-check a kid-newspaper fun fact about ${name}.
FACT: ${draft.fact}
SOURCE SENTENCE: ${draft.quote}
Pass only if (1) every claim in the FACT is stated in the SOURCE SENTENCE (no added numbers, superlatives or details), (2) it is current and unlikely to be wrong or disputed, and (3) it is kid-safe: ${RULES}
Reply with ONLY JSON: {"pass":true|false,"problem":"..."}`));
  if (chk?.pass !== true) return again(`check: ${chk?.problem ?? "no verdict"}`);
  return { name, fact: draft.fact.trim(), source: `Wikipedia: ${titleOf(x)}`, quote: draft.quote };
}

const failed = [];
let i = 0;
async function worker() {
  while (i < todo.length) {
    const t = todo[i++];
    if (bank[keyOf(t)] && !only.length) continue;
    const r = await one(t).catch((e) => ({ name: t.name, err: String(e) }));
    if (r.fact) bank[keyOf(t)] = { fact: r.fact, source: r.source, quote: r.quote };
    else failed.push(r);
    console.log(r.fact ? "ok  " : "FAIL", keyOf(t), String(r.fact ?? r.err).slice(0, 70));
    writeFileSync(OUT, JSON.stringify(bank, null, 1));
  }
}
await Promise.all(Array.from({ length: 2 }, worker));
console.log(`done: ${Object.keys(bank).length} facts, ${failed.length} failed`, failed.length);
