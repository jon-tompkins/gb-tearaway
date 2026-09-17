import type { AgeBand } from "../types";
import { pick } from "../rng";

export interface JokeItem {
  setup: string;
  punchline: string;
}

interface JokeEntry extends JokeItem {
  bands: AgeBand[];
}

const JOKES: JokeEntry[] = [
  { bands: ["4-6"], setup: "Why did the banana go to the doctor?", punchline: "It wasn’t peeling well." },
  { bands: ["4-6"], setup: "What do you call a sleepy cow?", punchline: "A bull-dozer… no, a cow-a-nap!" },
  { bands: ["4-6"], setup: "Why don’t eggs tell jokes?", punchline: "They’d crack each other up." },
  { bands: ["4-6"], setup: "What did the pancake say to the waffle?", punchline: "You’re waffle-y nice!" },
  { bands: ["4-6"], setup: "Why was the broom late?", punchline: "It over-swept." },
  { bands: ["4-6", "7-9"], setup: "What do you call cheese that isn’t yours?", punchline: "Nacho cheese." },
  { bands: ["4-6", "7-9"], setup: "Why did the cookie go to the hospital?", punchline: "It felt crumb-y." },
  { bands: ["4-6", "7-9"], setup: "How do you make a tissue dance?", punchline: "Put a little boogie in it." },
  { bands: ["4-6"], setup: "What do clouds wear under their clothes?", punchline: "Thunderwear." },
  { bands: ["4-6", "7-9"], setup: "Why did the student eat his homework?", punchline: "The teacher said it was a piece of cake." },
  { bands: ["4-6"], setup: "What’s a cat’s favorite color?", punchline: "Purr-ple." },
  { bands: ["4-6", "7-9"], setup: "Why can’t you give Elsa a balloon?", punchline: "Because she’ll let it go." },
  { bands: ["7-9"], setup: "Why did the scarecrow get a raise?", punchline: "He was outstanding in his field." },
  { bands: ["7-9", "10-12"], setup: "What do you call a fake noodle?", punchline: "An impasta." },
  { bands: ["7-9"], setup: "Why don’t scientists trust atoms?", punchline: "Because they make up everything." },
  { bands: ["7-9", "10-12"], setup: "What did one wall say to the other?", punchline: "I’ll meet you at the corner." },
  { bands: ["7-9"], setup: "Why did the bicycle fall over?", punchline: "It was two-tired." },
  { bands: ["7-9", "10-12"], setup: "What’s orange and sounds like a parrot?", punchline: "A carrot." },
  { bands: ["7-9"], setup: "Why did the golfer bring two pairs of pants?", punchline: "In case he got a hole in one." },
  { bands: ["7-9", "10-12"], setup: "How does a penguin build a house?", punchline: "Igloos it together." },
  { bands: ["7-9"], setup: "What do you call a bear with no teeth?", punchline: "A gummy bear." },
  { bands: ["10-12"], setup: "Why can’t you hear a pterodactyl go to the bathroom?", punchline: "Because the P is silent." },
  { bands: ["10-12"], setup: "What do you call an alligator in a vest?", punchline: "An investigator." },
  { bands: ["10-12"], setup: "Why did the math book look so sad?", punchline: "It had too many problems." },
  { bands: ["10-12"], setup: "What’s the best thing about Switzerland?", punchline: "I don’t know, but the flag is a big plus." },
  { bands: ["10-12"], setup: "Why do bees have sticky hair?", punchline: "They use honeycombs." },
  { bands: ["4-6", "7-9"], setup: "What time is it when an elephant sits on your fence?", punchline: "Time to get a new fence." },
  { bands: ["4-6"], setup: "Why did the teddy bear say no to dessert?", punchline: "It was already stuffed." },
  { bands: ["7-9", "10-12"], setup: "How do you organize a space party?", punchline: "You planet." },
  { bands: ["4-6", "7-9"], setup: "What do you call a snowman in summer?", punchline: "A puddle." },
  { bands: ["7-9"], setup: "Why was the calendar always calm?", punchline: "Its days were numbered — but it kept cool." },
  { bands: ["10-12"], setup: "I told my dog we were getting a cat. Want to know his reaction?", punchline: "He was feline fine about it… after a minute." },
  { bands: ["4-6"], setup: "Knock knock. Who’s there? Lettuce.", punchline: "Lettuce in — it’s breakfast time!" },
  { bands: ["7-9", "10-12"], setup: "What’s a skeleton’s least favorite room?", punchline: "The living room." },
  { bands: ["4-6", "7-9"], setup: "Why did the tomato turn red?", punchline: "It saw the salad dressing." },
  { bands: ["10-12"], setup: "Parallel lines have so much in common.", punchline: "It’s a shame they’ll never meet." },
];

export function pickJoke(band: AgeBand, rng: () => number): JokeItem {
  const pool = JOKES.filter((j) => j.bands.includes(band));
  const j = pick(rng, pool.length ? pool : JOKES);
  return { setup: j.setup, punchline: j.punchline };
}
