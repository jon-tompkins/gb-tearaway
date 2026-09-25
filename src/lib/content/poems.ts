import type { AgeBand, SlotSize } from "../types";
import { pick } from "../rng";

export interface PoemItem {
  title: string;
  author: string;
  lines: string[];
}

interface PoemEntry extends PoemItem {
  bands: AgeBand[];
}

/**
 * Real, **public-domain** poems (safe to print) — kid-appropriate classics with
 * attribution. Selection is by length: a poem is only offered for a card size
 * whose line window it fits, so it fills the card without clipping or leaving
 * it half-empty.
 */
const POEMS: PoemEntry[] = [
  // --- Short (½) ---
  {
    bands: ["4-6", "7-9", "10-12"],
    title: "The Purple Cow",
    author: "Gelett Burgess",
    lines: [
      "I never saw a Purple Cow,",
      "I never hope to see one;",
      "But I can tell you, anyhow,",
      "I’d rather see than be one!",
    ],
  },
  {
    bands: ["4-6", "7-9"],
    title: "Whole Duty of Children",
    author: "Robert Louis Stevenson",
    lines: [
      "A child should always say what’s true",
      "And speak when he is spoken to,",
      "And behave mannerly at table;",
      "At least as far as he is able.",
    ],
  },

  // --- Medium (1×) ---
  {
    bands: ["4-6", "7-9"],
    title: "Mix a Pancake",
    author: "Christina Rossetti",
    lines: [
      "Mix a pancake,",
      "Stir a pancake,",
      "Pop it in the pan;",
      "Fry the pancake,",
      "Toss the pancake,",
      "Catch it if you can.",
    ],
  },
  {
    bands: ["7-9", "10-12"],
    title: "Fog",
    author: "Carl Sandburg",
    lines: [
      "The fog comes",
      "on little cat feet.",
      "It sits looking",
      "over harbor and city",
      "on silent haunches",
      "and then moves on.",
    ],
  },
  {
    bands: ["7-9", "10-12"],
    title: "The Eagle",
    author: "Alfred, Lord Tennyson",
    lines: [
      "He clasps the crag with crooked hands;",
      "Close to the sun in lonely lands,",
      "Ring’d with the azure world, he stands.",
      "The wrinkled sea beneath him crawls;",
      "He watches from his mountain walls,",
      "And like a thunderbolt he falls.",
    ],
  },
  {
    bands: ["4-6", "7-9", "10-12"],
    title: "The Swing",
    author: "Robert Louis Stevenson",
    lines: [
      "How do you like to go up in a swing,",
      "Up in the air so blue?",
      "Oh, I do think it the pleasantest thing",
      "Ever a child can do!",
      "",
      "Up in the air and over the wall,",
      "Till I can see so wide,",
      "Rivers and trees and cattle and all",
      "Over the countryside—",
    ],
  },
  {
    bands: ["4-6", "7-9"],
    title: "The Star",
    author: "Jane Taylor",
    lines: [
      "Twinkle, twinkle, little star,",
      "How I wonder what you are!",
      "Up above the world so high,",
      "Like a diamond in the sky.",
      "",
      "When the blazing sun is gone,",
      "When he nothing shines upon,",
      "Then you show your little light,",
      "Twinkle, twinkle, all the night.",
    ],
  },
  {
    bands: ["10-12"],
    title: "Hope is the thing with feathers",
    author: "Emily Dickinson",
    lines: [
      "“Hope” is the thing with feathers—",
      "That perches in the soul—",
      "And sings the tune without the words—",
      "And never stops—at all—",
      "",
      "And sweetest—in the Gale—is heard—",
      "And sore must be the storm—",
      "That could abash the little Bird",
      "That kept so many warm—",
    ],
  },

  // --- Long (2×) ---
  {
    bands: ["4-6", "7-9", "10-12"],
    title: "Bed in Summer",
    author: "Robert Louis Stevenson",
    lines: [
      "In winter I get up at night",
      "And dress by yellow candle-light.",
      "In summer, quite the other way,",
      "I have to go to bed by day.",
      "",
      "I have to go to bed and see",
      "The birds still hopping on the tree,",
      "Or hear the grown-up people’s feet",
      "Still going past me in the street.",
      "",
      "And does it not seem hard to you,",
      "When all the sky is clear and blue,",
      "And I should like so much to play,",
      "To have to go to bed by day?",
    ],
  },
  {
    bands: ["4-6", "7-9", "10-12"],
    title: "Where Go the Boats?",
    author: "Robert Louis Stevenson",
    lines: [
      "Dark brown is the river,",
      "Golden is the sand.",
      "It flows along for ever,",
      "With trees on either hand.",
      "",
      "Green leaves a-floating,",
      "Castles of the foam,",
      "Boats of mine a-boating—",
      "Where will all come home?",
      "",
      "On goes the river",
      "And out past the mill,",
      "Away down the valley,",
      "Away down the hill.",
      "",
      "Away down the river,",
      "A hundred miles or more,",
      "Other little children",
      "Shall bring my boats ashore.",
    ],
  },
  {
    bands: ["7-9", "10-12"],
    title: "My Shadow",
    author: "Robert Louis Stevenson",
    lines: [
      "I have a little shadow that goes in and out with me,",
      "And what can be the use of him is more than I can see.",
      "He is very, very like me from the heels up to the head;",
      "And I see him jump before me, when I jump into my bed.",
      "",
      "The funniest thing about him is the way he likes to grow—",
      "Not at all like proper children, which is always very slow;",
      "For he sometimes shoots up taller like an india-rubber ball,",
      "And he sometimes gets so little that there’s none of him at all.",
    ],
  },
  {
    bands: ["4-6", "7-9", "10-12"],
    title: "The Land of Counterpane",
    author: "Robert Louis Stevenson",
    lines: [
      "When I was sick and lay a-bed,",
      "I had two pillows at my head,",
      "And all my toys beside me lay",
      "To keep me happy all the day.",
      "",
      "And sometimes for an hour or so",
      "I watched my leaden soldiers go,",
      "With different uniforms and drills,",
      "Among the bed-clothes, through the hills;",
      "",
      "And sometimes sent my ships in fleets",
      "All up and down among the sheets;",
      "Or brought my trees and houses out,",
      "And planted cities all about.",
      "",
      "I was the giant great and still",
      "That sits upon the pillow-hill,",
      "And sees before him, dale and plain,",
      "The pleasant land of counterpane.",
    ],
  },
];

/** Printable content height (mm) inside each card size, and the column width. */
const POEM_CONTENT_MM: Record<SlotSize, number> = { half: 20, full: 48, double: 104 };
const POEM_COL_MM = 90; // a Letter print column
const POEM_MIN_FONT = 8; // never smaller than the news size
const POEM_MAX_FONT = 16; // grow this large to fill a card (a featured verse)
const PT_MM = 0.3528; // 1pt in mm

/** All printed lines of a poem: title, body, attribution. */
export function poemLines(p: PoemItem): string[] {
  return [p.title, ...p.lines, `— ${p.author}`];
}

/**
 * Rendered height (mm) of a poem's lines at a font size — accounts for long
 * lines WRAPPING (monospace ≈ 0.6em/char) and half-height blank stanza breaks.
 */
function poemHeightMm(lines: string[], fontPt: number): number {
  const charsPerLine = Math.max(8, Math.floor(POEM_COL_MM / (0.6 * fontPt * PT_MM)));
  const lineMm = fontPt * 1.15 * PT_MM;
  let h = 0;
  for (const l of lines) {
    if (l.trim() === "") {
      h += 0.4 * fontPt * PT_MM;
      continue;
    }
    h += Math.max(1, Math.ceil(l.length / charsPerLine)) * lineMm;
  }
  return h;
}

/** A poem's home = the SMALLEST card it fits in at the 8pt floor. */
export function naturalPoemSize(p: PoemItem): SlotSize {
  const lines = poemLines(p);
  const floorH = poemHeightMm(lines, POEM_MIN_FONT);
  if (floorH <= POEM_CONTENT_MM.half) return "half";
  if (floorH <= POEM_CONTENT_MM.full) return "full";
  return "double";
}

/** Largest font (8–16pt) at which the poem still fits the card — fills it. */
export function poemFontPt(lines: string[], size: SlotSize): number {
  const budget = POEM_CONTENT_MM[size] * 0.98;
  for (let f = POEM_MAX_FONT; f >= POEM_MIN_FONT; f -= 0.5) {
    if (poemHeightMm(lines, f) <= budget) return f;
  }
  return POEM_MIN_FONT;
}

function fitsSize(p: PoemItem, size: SlotSize): boolean {
  return naturalPoemSize(p) === size;
}

/** Pick a public-domain poem whose length suits the card size. */
export function pickPoem(band: AgeBand, rng: () => number, size: SlotSize = "full"): PoemItem {
  const fits = POEMS.filter((p) => fitsSize(p, size));
  const pool = fits.length ? fits : POEMS;
  const byBand = pool.filter((p) => p.bands.includes(band));
  const src = byBand.length ? byBand : pool;
  const p = pick(rng, src);
  return { title: p.title, author: p.author, lines: p.lines };
}

/** Longest / shortest poem that fits a size — for module preview examples. */
export function extremePoemForSize(size: SlotSize, which: "longest" | "shortest"): PoemItem {
  const fits = POEMS.filter((p) => fitsSize(p, size));
  const pool = fits.length ? fits : POEMS;
  const sorted = [...pool].sort(
    (a, b) => poemHeightMm(poemLines(a), POEM_MIN_FONT) - poemHeightMm(poemLines(b), POEM_MIN_FONT),
  );
  const p = which === "longest" ? sorted[sorted.length - 1] : sorted[0];
  return { title: p.title, author: p.author, lines: p.lines };
}
