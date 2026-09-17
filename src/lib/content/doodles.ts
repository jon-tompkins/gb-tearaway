import type { AgeBand } from "../types";
import { pick } from "../rng";

export interface DoodleItem {
  prompt: string;
  tip: string;
}

interface DoodleEntry extends DoodleItem {
  bands: AgeBand[];
}

const DOODLES: DoodleEntry[] = [
  { bands: ["4-6"], prompt: "Draw a smiling sun wearing sunglasses.", tip: "30 seconds · keep it chunky." },
  { bands: ["4-6"], prompt: "Draw your breakfast as a cartoon character.", tip: "Give it eyes and a smile." },
  { bands: ["4-6"], prompt: "Draw a tiny rocket made of spoons.", tip: "One spoon, or a stack." },
  { bands: ["4-6"], prompt: "Draw a cat that is also a cloud.", tip: "Soft edges, whiskers optional." },
  { bands: ["4-6"], prompt: "Draw the view out a window — even if it’s imaginary.", tip: "Three simple shapes is enough." },
  { bands: ["4-6", "7-9"], prompt: "Draw a house that could float on water.", tip: "Add one silly feature." },
  { bands: ["4-6", "7-9"], prompt: "Draw your name as a wiggly worm.", tip: "Letters can bend." },
  { bands: ["4-6", "7-9"], prompt: "Draw a sandwich with a secret ingredient.", tip: "Label the secret." },
  { bands: ["7-9"], prompt: "Draw a robot whose job is making toast.", tip: "Show one moving part." },
  { bands: ["7-9"], prompt: "Draw a maze door with a funny doorknob.", tip: "The knob can be an animal." },
  { bands: ["7-9", "10-12"], prompt: "Draw today’s weather as a costume on a stick figure.", tip: "Umbrella, scarf, or sun hat." },
  { bands: ["7-9"], prompt: "Draw a bicycle that can climb stairs.", tip: "Invent the trick." },
  { bands: ["7-9", "10-12"], prompt: "Draw a map of this kitchen from ant height.", tip: "One crumb counts as a landmark." },
  { bands: ["7-9"], prompt: "Draw a monster that only eats vegetables — happily.", tip: "Make it friendly, not scary." },
  { bands: ["10-12"], prompt: "Draw a logo for a lemonade stand on Mars.", tip: "Use 2–3 shapes max." },
  { bands: ["10-12"], prompt: "Draw a bridge between two cereal boxes.", tip: "Perspective optional." },
  { bands: ["10-12"], prompt: "Sketch a one-panel comic about waiting for toast.", tip: "One speech bubble." },
  { bands: ["10-12"], prompt: "Draw the same mug three ways: happy, sleepy, surprised.", tip: "Tiny faces only." },
  { bands: ["4-6"], prompt: "Draw five circles. Turn each into something different.", tip: "Clock, face, pizza…", },
  { bands: ["4-6", "7-9"], prompt: "Draw a fish wearing rain boots.", tip: "Why not?" },
  { bands: ["7-9", "10-12"], prompt: "Draw a secret handshake as four stick-figure frames.", tip: "Number the steps." },
  { bands: ["10-12"], prompt: "Invent a gadget that folds laundry. Draw the patent sketch.", tip: "Arrows help." },
  { bands: ["4-6"], prompt: "Draw a rainbow using only dots.", tip: "No long lines." },
  { bands: ["7-9"], prompt: "Draw your backpack as if it had feelings.", tip: "Heavy day? Excited day?" },
  { bands: ["4-6", "7-9"], prompt: "Draw a tiny parade marching across the bottom of this strip.", tip: "Three characters max." },
  { bands: ["10-12"], prompt: "Draw negative space: the hole in a bagel, bigger than the bagel.", tip: "Play with scale." },
  { bands: ["7-9", "10-12"], prompt: "Design a stamp for “first pancake of the week.”", tip: "Keep it postage-stamp small." },
  { bands: ["4-6"], prompt: "Draw a dinosaur reading a book at the table.", tip: "Big dino, little book — or flip it." },
];

export function pickDoodle(band: AgeBand, rng: () => number): DoodleItem {
  const pool = DOODLES.filter((d) => d.bands.includes(band));
  const d = pick(rng, pool.length ? pool : DOODLES);
  return { prompt: d.prompt, tip: d.tip };
}
