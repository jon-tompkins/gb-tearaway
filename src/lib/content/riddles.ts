import type { AgeBand } from "../types";
import { pick } from "../rng";

export interface RiddleItem {
  question: string;
  answer: string;
}

interface RiddleEntry extends RiddleItem {
  bands: AgeBand[];
}

const RIDDLES: RiddleEntry[] = [
  { bands: ["4-6"], question: "I have a face and two hands, but no arms or legs. What am I?", answer: "A clock." },
  { bands: ["4-6"], question: "What has to be broken before you can use it?", answer: "An egg." },
  { bands: ["4-6"], question: "What gets wetter the more it dries?", answer: "A towel." },
  { bands: ["4-6"], question: "I’m tall when I’m young and short when I’m old. What am I?", answer: "A candle." },
  { bands: ["4-6", "7-9"], question: "What has keys but can’t open doors?", answer: "A piano (or a computer keyboard)." },
  { bands: ["4-6"], question: "What has a head and a tail but no body?", answer: "A coin." },
  { bands: ["4-6", "7-9"], question: "What room has no doors or windows?", answer: "A mushroom." },
  { bands: ["4-6", "7-9"], question: "What can you catch but not throw?", answer: "A cold." },
  { bands: ["7-9"], question: "I speak without a mouth and hear without ears. What am I?", answer: "An echo." },
  { bands: ["7-9"], question: "The more you take, the more you leave behind. What are they?", answer: "Footsteps." },
  { bands: ["7-9", "10-12"], question: "What has cities, but no houses; forests, but no trees; water, but no fish?", answer: "A map." },
  { bands: ["7-9"], question: "What invention lets you look through a wall?", answer: "A window." },
  { bands: ["7-9", "10-12"], question: "What building has the most stories?", answer: "A library." },
  { bands: ["7-9"], question: "What goes up but never comes down?", answer: "Your age." },
  { bands: ["7-9", "10-12"], question: "I have branches, but no fruit, trunk, or leaves. What am I?", answer: "A bank." },
  { bands: ["10-12"], question: "What English word has three consecutive double letters?", answer: "Bookkeeper." },
  { bands: ["10-12"], question: "What can travel around the world while staying in a corner?", answer: "A stamp." },
  { bands: ["10-12"], question: "Forward I am heavy; backward I am not. What am I?", answer: "The word ton." },
  { bands: ["10-12"], question: "What disappears as soon as you say its name?", answer: "Silence." },
  { bands: ["10-12"], question: "I am always in front of you but can’t be seen. What am I?", answer: "The future." },
  { bands: ["4-6"], question: "What kind of key opens a banana?", answer: "A mon-key." },
  { bands: ["4-6", "7-9"], question: "What has four legs in the morning, two at noon, and three at night — wait, that’s too hard. Simpler: what has four wheels and flies?", answer: "A garbage truck." },
  { bands: ["7-9"], question: "Where does Thursday come before Wednesday?", answer: "In the dictionary." },
  { bands: ["4-6"], question: "What do you call a bear without an ear?", answer: "B." },
  { bands: ["7-9", "10-12"], question: "What runs but never walks, has a bed but never sleeps?", answer: "A river." },
  { bands: ["10-12"], question: "What begins with T, ends with T, and has T in it?", answer: "A teapot." },
  { bands: ["4-6", "7-9"], question: "If you drop me, I’m sure to crack — but give me a smile and I’ll always smile back. What am I?", answer: "A mirror." },
  { bands: ["7-9", "10-12"], question: "What has one eye but can’t see?", answer: "A needle." },
  { bands: ["4-6"], question: "What is full of holes but still holds water?", answer: "A sponge." },
  { bands: ["10-12"], question: "A cowboy rode into town on Friday. He stayed three days and left on Friday. How?", answer: "His horse was named Friday." },
];

export function pickRiddle(band: AgeBand, rng: () => number): RiddleItem {
  const pool = RIDDLES.filter((r) => r.bands.includes(band));
  const r = pick(rng, pool.length ? pool : RIDDLES);
  return { question: r.question, answer: r.answer };
}
