import type { AgeBand, SlotSize } from "../types";
import { pick } from "../rng";

export interface PoemItem {
  title: string;
  author: string;
  lines: string[];
}

interface PoemEntry extends PoemItem {
  bands: AgeBand[];
  /** Card sizes this poem's length suits. */
  sizes: SlotSize[];
}

/**
 * Real, **public-domain** poems (safe to print) — kid-appropriate classics with
 * attribution. Tagged by the card size their length fits: short → ½/1×,
 * medium → 1×/2×, long → 2×.
 */
const POEMS: PoemEntry[] = [
  // --- Short (½ / 1×) ---
  {
    bands: ["4-6", "7-9", "10-12"],
    sizes: ["half", "full"],
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
    sizes: ["half", "full"],
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
    sizes: ["half", "full"],
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
    sizes: ["half", "full"],
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
    bands: ["4-6", "7-9"],
    sizes: ["half", "full"],
    title: "Whole Duty of Children",
    author: "Robert Louis Stevenson",
    lines: [
      "A child should always say what’s true",
      "And speak when he is spoken to,",
      "And behave mannerly at table;",
      "At least as far as he is able.",
    ],
  },

  // --- Medium (1× / 2×) ---
  {
    bands: ["4-6", "7-9", "10-12"],
    sizes: ["full", "double"],
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
    sizes: ["full", "double"],
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
    sizes: ["full", "double"],
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
    sizes: ["double"],
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
    sizes: ["double"],
    title: "The Owl and the Pussy-Cat",
    author: "Edward Lear",
    lines: [
      "The Owl and the Pussy-cat went to sea",
      "In a beautiful pea-green boat,",
      "They took some honey, and plenty of money,",
      "Wrapped up in a five-pound note.",
      "The Owl looked up to the stars above,",
      "And sang to a small guitar,",
      "“O lovely Pussy! O Pussy, my love,",
      "What a beautiful Pussy you are,",
      "You are,",
      "You are!",
      "What a beautiful Pussy you are!”",
    ],
  },
];

/** Pick a public-domain poem that fits the card size (falls back gracefully). */
export function pickPoem(band: AgeBand, rng: () => number, size: SlotSize = "full"): PoemItem {
  const bySize = POEMS.filter((p) => p.sizes.includes(size));
  const pool = bySize.length ? bySize : POEMS;
  const byBand = pool.filter((p) => p.bands.includes(band));
  const src = byBand.length ? byBand : pool;
  const p = pick(rng, src);
  return { title: p.title, author: p.author, lines: p.lines };
}
