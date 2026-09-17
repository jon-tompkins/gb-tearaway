import type { AgeBand } from "../types";
import { pick } from "../rng";

export interface PoemItem {
  title: string;
  lines: string[];
}

interface PoemEntry extends PoemItem {
  bands: AgeBand[];
}

const POEMS: PoemEntry[] = [
  {
    bands: ["4-6"],
    title: "Toast Song",
    lines: ["Butter melts,", "jam goes drip,", "I take a bite —", "crunch! slip! sip!"],
  },
  {
    bands: ["4-6"],
    title: "Sock Mystery",
    lines: ["One sock here,", "one sock… where?", "Maybe dancing", "under the chair."],
  },
  {
    bands: ["4-6"],
    title: "Moon Hug",
    lines: ["The moon is round,", "the moon is bright,", "it hugs the dark", "and says good night."],
  },
  {
    bands: ["4-6", "7-9"],
    title: "Puddle Boots",
    lines: ["Splash left,", "splash right,", "boots make circles", "of silver light."],
  },
  {
    bands: ["4-6"],
    title: "Tiny Ant",
    lines: ["Tiny ant,", "heavy crumb,", "you’re stronger", "than you look — yum."],
  },
  {
    bands: ["4-6", "7-9"],
    title: "Cloud Zoo",
    lines: ["A dragon cloud,", "a sheep cloud too,", "I name them all —", "my sky-day zoo."],
  },
  {
    bands: ["4-6"],
    title: "Banana Phone",
    lines: ["Hello? Hello?", "It’s me, the fruit.", "I’m yellow,", "and a little cute."],
  },
  {
    bands: ["7-9"],
    title: "Pencil Forest",
    lines: ["Graphite trees", "on paper ground,", "I draw a path", "without a sound."],
  },
  {
    bands: ["7-9"],
    title: "Bus Window",
    lines: ["Houses blur,", "the trees go by,", "my backpack hums", "a sleepy sigh."],
  },
  {
    bands: ["7-9", "10-12"],
    title: "Quiet Library",
    lines: ["Books lean close", "like friendly walls,", "stories wait", "in careful halls."],
  },
  {
    bands: ["7-9"],
    title: "Shadow Tag",
    lines: ["My shadow runs", "when I run too —", "we never win,", "we never lose."],
  },
  {
    bands: ["7-9", "10-12"],
    title: "Kitchen Orbit",
    lines: ["Spoons circle bowls,", "steam lifts slow,", "breakfast is", "a tiny show."],
  },
  {
    bands: ["7-9"],
    title: "Lost Button",
    lines: ["A button rolled", "beneath the couch —", "tonight it dreams", "it’s still a pouch."],
  },
  {
    bands: ["10-12"],
    title: "First Light",
    lines: ["The window holds", "a silver seam,", "day stitches in", "a careful dream."],
  },
  {
    bands: ["10-12"],
    title: "Map Fold",
    lines: ["Crease the paper,", "name the creek,", "adventure fits", "inside a week."],
  },
  {
    bands: ["10-12"],
    title: "After Rain",
    lines: ["Pavement shines", "like borrowed glass,", "we walk through puddles", "of the past."],
  },
  {
    bands: ["10-12"],
    title: "Homework Moon",
    lines: ["Problems wait", "in quiet rows,", "the moon keeps score", "of what we know."],
  },
  {
    bands: ["10-12"],
    title: "Bridge of Notes",
    lines: ["A song can span", "from here to there —", "one held note,", "one shared air."],
  },
  {
    bands: ["4-6", "7-9"],
    title: "Crayon Sun",
    lines: ["Yellow circle,", "orange rays,", "I color warmth", "into the days."],
  },
  {
    bands: ["7-9", "10-12"],
    title: "Pocket Stone",
    lines: ["Smooth and cool,", "a secret keep —", "the river lent it", "while asleep."],
  },
  {
    bands: ["4-6"],
    title: "Good Morning Cat",
    lines: ["Stretch,", "yawn,", "purr,", "then — done.", "Cat says hello", "to everyone."],
  },
  {
    bands: ["10-12"],
    title: "Signal Firefly",
    lines: ["One blink means", "I’m almost near;", "two blinks mean", "summer’s here."],
  },
];

export function pickPoem(band: AgeBand, rng: () => number): PoemItem {
  const pool = POEMS.filter((p) => p.bands.includes(band));
  const p = pick(rng, pool.length ? pool : POEMS);
  return { title: p.title, lines: [...p.lines] };
}
