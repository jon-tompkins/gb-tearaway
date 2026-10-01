import type { AgeBand } from "../types";
import { pick } from "../rng";

export interface ScrambleItem {
  word: string;
  hint: string;
}

interface ScrambleEntry extends ScrambleItem {
  bands: AgeBand[];
}

/** Age-banded word bank. Short/common for littles, longer/trickier for olders. */
const SCRAMBLES: ScrambleEntry[] = [
  // 4–6 — short, concrete, phonetic
  { bands: ["4-6"], word: "cat", hint: "A pet that says meow." },
  { bands: ["4-6"], word: "dog", hint: "A pet that says woof." },
  { bands: ["4-6"], word: "sun", hint: "It shines in the day sky." },
  { bands: ["4-6"], word: "star", hint: "It twinkles at night." },
  { bands: ["4-6"], word: "fish", hint: "It swims and has fins." },
  { bands: ["4-6"], word: "milk", hint: "A white drink from a cow." },
  { bands: ["4-6"], word: "frog", hint: "Green and it hops." },
  { bands: ["4-6"], word: "moon", hint: "It glows at night." },
  { bands: ["4-6"], word: "bird", hint: "It has wings and sings." },
  { bands: ["4-6"], word: "cake", hint: "A sweet treat for birthdays." },
  { bands: ["4-6"], word: "ball", hint: "You bounce, kick, or throw it." },
  { bands: ["4-6"], word: "tree", hint: "It has leaves and branches." },

  // 7–9 — everyday vocabulary
  { bands: ["7-9"], word: "planet", hint: "Earth is one of these." },
  { bands: ["7-9"], word: "garden", hint: "A place where flowers grow." },
  { bands: ["7-9"], word: "rocket", hint: "It blasts off into space." },
  { bands: ["7-9"], word: "puzzle", hint: "You solve it, piece by piece." },
  { bands: ["7-9"], word: "dragon", hint: "A mythical beast that breathes fire." },
  { bands: ["7-9"], word: "island", hint: "Land surrounded by water." },
  { bands: ["7-9"], word: "rainbow", hint: "Colored arc after the rain." },
  { bands: ["7-9"], word: "monster", hint: "A scary make-believe creature." },
  { bands: ["7-9"], word: "kitchen", hint: "The room where meals are cooked." },
  { bands: ["7-9"], word: "octopus", hint: "A sea animal with eight arms." },
  { bands: ["7-9", "10-12"], word: "compass", hint: "It always points north." },
  { bands: ["7-9", "10-12"], word: "volcano", hint: "A mountain that can erupt." },

  // 10–12 — longer, science & world words
  { bands: ["10-12"], word: "gravity", hint: "The force that pulls things down." },
  { bands: ["10-12"], word: "molecule", hint: "Two or more atoms bonded together." },
  { bands: ["10-12"], word: "telescope", hint: "You use it to see far-off stars." },
  { bands: ["10-12"], word: "dinosaur", hint: "A giant reptile from long ago." },
  { bands: ["10-12"], word: "continent", hint: "Africa and Asia are each one." },
  { bands: ["10-12"], word: "electric", hint: "___ current powers your lamp." },
  { bands: ["10-12"], word: "mountain", hint: "Everest is the tallest one." },
  { bands: ["10-12"], word: "pyramid", hint: "Ancient Egyptians built these." },
  { bands: ["10-12"], word: "magnetic", hint: "A ___ field moves a compass needle." },
  { bands: ["10-12"], word: "hurricane", hint: "A huge spinning ocean storm." },

  // 4–6 — more short, concrete words
  { bands: ["4-6"], word: "bee", hint: "It buzzes and makes honey." },
  { bands: ["4-6"], word: "cow", hint: "A farm animal that says moo." },
  { bands: ["4-6"], word: "hat", hint: "You wear it on your head." },
  { bands: ["4-6"], word: "cup", hint: "You drink water from it." },
  { bands: ["4-6"], word: "pig", hint: "A pink farm animal that oinks." },
  { bands: ["4-6"], word: "bus", hint: "A big vehicle that carries many people." },
  { bands: ["4-6"], word: "box", hint: "A square container for storing things." },
  { bands: ["4-6"], word: "key", hint: "It unlocks a door." },
  { bands: ["4-6"], word: "bed", hint: "You sleep in it at night." },
  { bands: ["4-6"], word: "egg", hint: "A hen lays it." },
  { bands: ["4-6"], word: "van", hint: "A vehicle bigger than a car." },
  { bands: ["4-6"], word: "jam", hint: "A sweet spread for toast." },
  { bands: ["4-6"], word: "web", hint: "A spider spins it." },
  { bands: ["4-6"], word: "owl", hint: "A bird that hoots at night." },
  { bands: ["4-6"], word: "ant", hint: "A tiny insect that lives in a colony." },
  { bands: ["4-6"], word: "fox", hint: "A clever orange animal with a bushy tail." },
  { bands: ["4-6"], word: "hen", hint: "A female chicken." },
  { bands: ["4-6"], word: "rug", hint: "A soft mat on the floor." },
  { bands: ["4-6"], word: "top", hint: "The opposite of bottom." },
  { bands: ["4-6"], word: "sock", hint: "You wear it on your foot." },
  { bands: ["4-6"], word: "boat", hint: "It floats on the water." },
  { bands: ["4-6"], word: "rain", hint: "Water falling from the clouds." },
  { bands: ["4-6"], word: "snow", hint: "Cold white flakes in winter." },
  { bands: ["4-6"], word: "leaf", hint: "A green part of a plant." },
  { bands: ["4-6"], word: "worm", hint: "A wriggly creature in the soil." },
  { bands: ["4-6"], word: "duck", hint: "A bird that says quack." },
  { bands: ["4-6"], word: "book", hint: "You read its pages." },
  { bands: ["4-6"], word: "drum", hint: "You bang it to make a beat." },
  { bands: ["4-6"], word: "kite", hint: "It flies on a string in the wind." },
  { bands: ["4-6"], word: "king", hint: "A man who rules a kingdom." },
  { bands: ["4-6"], word: "ring", hint: "Jewelry you wear on a finger." },
  { bands: ["4-6"], word: "nest", hint: "Where a bird lays its eggs." },
  { bands: ["4-6"], word: "seed", hint: "Plant it and a flower grows." },
  { bands: ["4-6"], word: "corn", hint: "A yellow veggie on a cob." },

  // 7–9 — more everyday vocabulary
  { bands: ["7-9"], word: "zebra", hint: "A striped animal like a horse." },
  { bands: ["7-9"], word: "tiger", hint: "A big orange cat with stripes." },
  { bands: ["7-9"], word: "camel", hint: "A desert animal with humps." },
  { bands: ["7-9"], word: "robot", hint: "A machine that can move on its own." },
  { bands: ["7-9"], word: "apple", hint: "A crunchy red or green fruit." },
  { bands: ["7-9"], word: "lemon", hint: "A sour yellow fruit." },
  { bands: ["7-9"], word: "honey", hint: "A sweet syrup bees make." },
  { bands: ["7-9"], word: "cloud", hint: "A fluffy shape in the sky." },
  { bands: ["7-9"], word: "river", hint: "Water that flows to the sea." },
  { bands: ["7-9"], word: "beach", hint: "Sandy shore by the ocean." },
  { bands: ["7-9"], word: "wagon", hint: "A cart you pull behind you." },
  { bands: ["7-9"], word: "brush", hint: "You use it to comb your hair." },
  { bands: ["7-9"], word: "spoon", hint: "You eat soup with it." },
  { bands: ["7-9"], word: "chair", hint: "You sit on it." },
  { bands: ["7-9"], word: "table", hint: "You eat your meals on it." },
  { bands: ["7-9"], word: "flower", hint: "A colorful bloom on a plant." },
  { bands: ["7-9"], word: "pencil", hint: "You write with it and can erase." },
  { bands: ["7-9"], word: "button", hint: "You press it or fasten a shirt with it." },
  { bands: ["7-9"], word: "castle", hint: "A big stone home for a king." },
  { bands: ["7-9"], word: "forest", hint: "A place with lots of trees." },
  { bands: ["7-9"], word: "turtle", hint: "A slow animal with a hard shell." },
  { bands: ["7-9"], word: "rabbit", hint: "A hopping animal with long ears." },
  { bands: ["7-9"], word: "jungle", hint: "A thick, wild tropical forest." },
  { bands: ["7-9"], word: "pirate", hint: "A sailor who hunts for treasure." },
  { bands: ["7-9"], word: "guitar", hint: "A stringed instrument you strum." },
  { bands: ["7-9"], word: "violin", hint: "A small instrument played with a bow." },
  { bands: ["7-9"], word: "magnet", hint: "It sticks to metal." },
  { bands: ["7-9"], word: "basket", hint: "You carry apples in it." },
  { bands: ["7-9"], word: "dolphin", hint: "A smart, playful sea mammal." },
  { bands: ["7-9"], word: "penguin", hint: "A black-and-white bird that cannot fly." },

  // 10–12 — more longer, science & world words
  { bands: ["10-12"], word: "elephant", hint: "A huge gray animal with a trunk." },
  { bands: ["10-12"], word: "umbrella", hint: "It keeps the rain off you." },
  { bands: ["10-12"], word: "sandwich", hint: "Two slices of bread with filling." },
  { bands: ["10-12"], word: "computer", hint: "A machine for games and typing." },
  { bands: ["10-12"], word: "triangle", hint: "A shape with three sides." },
  { bands: ["10-12"], word: "calendar", hint: "It shows the days and months." },
  { bands: ["10-12"], word: "hospital", hint: "Where doctors help sick people." },
  { bands: ["10-12"], word: "birthday", hint: "The day you were born, once a year." },
  { bands: ["10-12"], word: "kangaroo", hint: "An animal that hops and has a pouch." },
  { bands: ["10-12"], word: "alphabet", hint: "All the letters from A to Z." },
  { bands: ["10-12"], word: "treasure", hint: "Gold and jewels a pirate hides." },
  { bands: ["10-12"], word: "vitamin", hint: "A nutrient that keeps you healthy." },
  { bands: ["10-12"], word: "blizzard", hint: "A very heavy snowstorm." },
  { bands: ["10-12"], word: "notebook", hint: "You write your notes in it." },
  { bands: ["10-12"], word: "scissors", hint: "You cut paper with them." },
  { bands: ["10-12"], word: "envelope", hint: "You put a letter inside it to mail." },
  { bands: ["10-12"], word: "magazine", hint: "A glossy booklet with articles." },
  { bands: ["10-12"], word: "asteroid", hint: "A rocky object floating in space." },
  { bands: ["10-12"], word: "skeleton", hint: "All the bones in your body." },
];

export function pickScramble(band: AgeBand, rng: () => number): ScrambleItem {
  const pool = SCRAMBLES.filter((s) => s.bands.includes(band));
  const src = pool.length ? pool : SCRAMBLES;
  const { word, hint } = pick(rng, src);
  return { word, hint };
}

/**
 * Deterministically shuffle a word's letters into an UPPERCASE scramble,
 * spaced out for young solvers. Guarantees the result differs from the word.
 */
export function scrambleWord(word: string, rng: () => number): string {
  const letters = word.toUpperCase().split("");
  if (letters.length < 2) return letters.join("");
  let out = letters.slice();
  for (let attempt = 0; attempt < 12; attempt++) {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    if (out.join("") !== letters.join("")) break;
  }
  // Fallback: if we somehow still match, rotate by one.
  if (out.join("") === letters.join("")) out = [...out.slice(1), out[0]];
  return out.join(" ");
}
