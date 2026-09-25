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

/**
 * Line windows per card size (title + body + attribution). Min keeps a big card
 * from sitting half-empty at the max font; max keeps a poem from clipping at the
 * news-size (8pt) floor. A poem too long for a size belongs in the next size up.
 */
export const POEM_MIN_LINES: Record<SlotSize, number> = { half: 4, full: 7, double: 14 };
export const POEM_MAX_LINES: Record<SlotSize, number> = { half: 6, full: 13, double: 26 };

/** Total printed lines for a poem (title + body + attribution). */
export function poemLineCount(p: PoemItem): number {
  return 1 + p.lines.length + 1;
}

/**
 * Body font (pt) so the poem roughly fills the card: bigger for short poems,
 * shrinking toward the news size (8pt) for long ones, never past an 11pt cap.
 */
export function poemFontPt(lineCount: number, size: SlotSize): number {
  const contentMm = size === "half" ? 19 : size === "full" ? 47 : 103;
  const ideal = (contentMm * 2.1) / Math.max(1, lineCount);
  return Math.max(8, Math.min(11, Math.round(ideal * 2) / 2));
}

function fitsSize(p: PoemItem, size: SlotSize): boolean {
  const n = poemLineCount(p);
  return n >= POEM_MIN_LINES[size] && n <= POEM_MAX_LINES[size];
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
  const sorted = [...pool].sort((a, b) => poemLineCount(a) - poemLineCount(b));
  const p = which === "longest" ? sorted[sorted.length - 1] : sorted[0];
  return { title: p.title, author: p.author, lines: p.lines };
}
