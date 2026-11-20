import { MODULE_CATALOG } from "../modules";
import { moduleExample } from "../moduleExample";
import type { ModuleId } from "../types";
import { ANIMALS } from "./animals";
import { CRYPTOGRAMS } from "./bank/cryptograms";
import { CROSSWORD_THEMES } from "./crosswords";
import { DINOSAURS } from "./dinosaurs";
import { FACTS } from "./facts";
import { HISTORY } from "./history";
import { JOKES } from "./jokes";
import { PLANES } from "./planes";
import { POEMS } from "./poems";
import { QUOTES } from "./quotes";
import { RECORDS } from "./records";
import { RIDDLES } from "./riddles";
import { SAMPLE_NEWS } from "./sampleNews";
import { SCRAMBLES } from "./scramble";
import { WORDS as SPANISH } from "./spanish";
import { TWISTERS } from "./twisters";
import { WORDS } from "./words";
import { WORDFIND_THEMES } from "../puzzles/wordfind";

export interface ContentPiece {
  source: string;
  text: string;
}

export interface DenylistTerm {
  raw: string;
  test: (text: string) => boolean;
}

export interface ContentViolation {
  source: string;
  term: string;
  excerpt: string;
}

const WORD_TERM = /^[A-Za-z][A-Za-z -]*$/;
const SKIP_KEYS = new Set(["spec", "path", "svg", "locator"]);

/** Parse the reviewable denylist file. See safety-denylist.txt for the rules. */
export function parseDenylist(fileText: string): DenylistTerm[] {
  const terms: DenylistTerm[] = [];
  for (const line of fileText.split(/\r?\n/)) {
    const raw = line.trim();
    if (!raw || raw.startsWith("#")) continue;
    if (WORD_TERM.test(raw)) {
      const body = raw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/ +/g, "\\s+");
      const re = new RegExp(`(?:^|\\b)${body}\\b`, "i");
      terms.push({ raw, test: (text) => re.test(text) });
    } else {
      const needle = raw.toLowerCase();
      terms.push({ raw, test: (text) => text.toLowerCase().includes(needle) });
    }
  }
  return terms;
}

function pushStrings(source: string, value: unknown, out: ContentPiece[], key?: string) {
  if (key && SKIP_KEYS.has(key)) return;
  if (typeof value === "string") {
    if (value.trim()) out.push({ source, text: value });
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) pushStrings(source, item, out);
    return;
  }
  if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) pushStrings(source, v, out, k);
  }
}

/** Static banks, module blurbs, sample news, and the example copy shown in the app. */
export function collectStaticKidContent(): ContentPiece[] {
  const pieces: ContentPiece[] = [];
  const banks: [string, unknown][] = [
    ["jokes", JOKES],
    ["facts", FACTS],
    ["records", RECORDS],
    ["quotes", QUOTES],
    ["riddles", RIDDLES],
    ["poems", POEMS],
    ["words", WORDS],
    ["spanish", SPANISH],
    ["history", HISTORY],
    ["animals", ANIMALS],
    ["dinosaurs", DINOSAURS],
    ["planes", PLANES],
    ["cryptograms", CRYPTOGRAMS],
    ["scrambles", SCRAMBLES],
    ["tongue-twisters", TWISTERS],
    ["crosswords", CROSSWORD_THEMES],
    ["wordfind", WORDFIND_THEMES],
    ["sample-news", SAMPLE_NEWS],
  ];
  for (const [source, value] of banks) pushStrings(source, value, pieces);

  for (const mod of MODULE_CATALOG) {
    pushStrings(`module-blurb:${mod.id}`, `${mod.name}\n${mod.blurb}`, pieces);
    const example = moduleExample(mod.id as ModuleId);
    pushStrings(`module-example:${mod.id}`, [example.text, example.note], pieces);
  }
  return pieces;
}

function excerpt(text: string, term: string): string {
  const at = text.toLowerCase().indexOf(term.toLowerCase());
  const start = Math.max(0, (at < 0 ? 0 : at) - 40);
  const slice = text.slice(start, start + term.length + 80).replace(/\s+/g, " ").trim();
  return slice.length > 120 ? `${slice.slice(0, 117)}...` : slice;
}

export function findContentViolations(pieces: ContentPiece[], terms: DenylistTerm[]): ContentViolation[] {
  const hits: ContentViolation[] = [];
  for (const piece of pieces) {
    for (const term of terms) {
      if (!term.test(piece.text)) continue;
      hits.push({ source: piece.source, term: term.raw, excerpt: excerpt(piece.text, term.raw) });
    }
  }
  return hits;
}
