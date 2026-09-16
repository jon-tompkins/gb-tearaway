import type { AgeBand, FactItem } from "../types";
import { pick } from "../rng";

interface FactEntry extends FactItem {
  bands: AgeBand[];
}

const FACTS: FactEntry[] = [
  { bands: ["4-6"], fact: "A group of flamingos is called a flamboyance.", extra: "They get their pink color from the food they eat." },
  { bands: ["4-6"], fact: "Otters hold hands when they sleep so they don’t drift apart.", extra: "Scientists call that a raft of otters." },
  { bands: ["4-6"], fact: "Honey never spoils. Jars thousands of years old can still be eaten.", extra: "Bees are tiny chemists." },
  { bands: ["4-6"], fact: "A banana is a berry, but a strawberry is not.", extra: "Botanists have surprising rules." },
  { bands: ["4-6", "7-9"], fact: "Octopuses have three hearts and blue blood.", extra: "Two hearts pump to the gills; one pumps to the body." },
  { bands: ["4-6", "7-9"], fact: "Wombat poop is cube-shaped.", extra: "The cubes stack and don’t roll away from their burrows." },
  { bands: ["4-6", "7-9"], fact: "Snails can sleep for up to three years.", extra: "They seal their shells and wait for rain." },
  { bands: ["4-6"], fact: "A day on Venus is longer than a year on Venus.", extra: "It spins very slowly, but races around the Sun." },
  { bands: ["4-6", "7-9"], fact: "Butterflies taste with their feet.", extra: "That’s how they know if a leaf is good for laying eggs." },
  { bands: ["4-6"], fact: "Cows have best friends and get stressed when they’re apart.", extra: "Farmers notice they stand together." },
  { bands: ["7-9"], fact: "The tongue print of a person is unique, like a fingerprint.", extra: "Don’t lick the paper to check." },
  { bands: ["7-9", "10-12"], fact: "There are more trees on Earth than stars in the Milky Way.", extra: "About three trillion trees; a few hundred billion stars in our galaxy." },
  { bands: ["7-9", "10-12"], fact: "A teaspoon of honey is the life’s work of about twelve bees.", extra: "Say thanks next time you drizzle it on toast." },
  { bands: ["7-9"], fact: "Sharks have been around longer than trees.", extra: "Early sharks swam about 400 million years ago; trees came later." },
  { bands: ["7-9", "10-12"], fact: "Your bones are about five times stronger than steel, by weight.", extra: "They’re also alive and rebuild themselves." },
  { bands: ["7-9"], fact: "A bolt of lightning is five times hotter than the surface of the Sun.", extra: "That’s why it can fuse sand into glass." },
  { bands: ["7-9", "10-12"], fact: "The Eiffel Tower grows about 6 inches taller in summer.", extra: "Heat makes the iron expand." },
  { bands: ["7-9"], fact: "Koalas have fingerprints almost identical to humans.", extra: "They’ve even confused crime-scene tape in training exercises." },
  { bands: ["7-9", "10-12"], fact: "One hummingbird egg is smaller than a jellybean.", extra: "The chick hatches in about two weeks." },
  { bands: ["10-12"], fact: "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid.", extra: "The pyramid is ~4,500 years old; Cleopatra died in 30 BCE." },
  { bands: ["10-12"], fact: "If you could fold a paper in half 42 times, it would reach the Moon.", extra: "Each fold doubles the thickness. Paper usually rips around seven." },
  { bands: ["10-12"], fact: "Oxford University is older than the Aztec Empire.", extra: "Teaching at Oxford began around 1096; Tenochtitlán was founded in 1325." },
  { bands: ["10-12"], fact: "A day on Earth used to last only about 22 hours.", extra: "The Moon’s gravity is slowly stretching our days." },
  { bands: ["10-12"], fact: "Bananas are slightly radioactive because they contain potassium-40.", extra: "You’d need to eat millions for it to matter. Eat the banana." },
  { bands: ["10-12"], fact: "The fingerprints of a koala are so close to ours that they can confuse detectives.", extra: "Marsupials and primates arrived at the same trick separately." },
  { bands: ["4-6", "7-9"], fact: "Sea otters have the thickest fur of any mammal.", extra: "Up to a million hairs per square inch keep them warm." },
  { bands: ["4-6"], fact: "Penguins propose with pebbles.", extra: "A smooth stone is a high compliment." },
  { bands: ["7-9", "10-12"], fact: "The shortest war in history lasted 38 minutes.", extra: "It was fought in 1896 between Britain and Zanzibar." },
  { bands: ["10-12"], fact: "Your stomach gets a new lining every few days.", extra: "Otherwise it would digest itself." },
  { bands: ["4-6", "7-9"], fact: "A snail can have about 14,000 teeth.", extra: "They sit on a tiny ribbon called a radula." },
  { bands: ["7-9"], fact: "The inventor of the Pringles can is buried in one.", extra: "Fredric Baur’s ashes went into a can of his own design." },
  { bands: ["10-12"], fact: "There’s a species of jellyfish that can reverse its life cycle.", extra: "Turritopsis dohrnii can return to a younger stage when stressed." },
  { bands: ["4-6"], fact: "Sloths can hold their breath longer than dolphins — over 40 minutes.", extra: "They slow their hearts to do it." },
  { bands: ["7-9", "10-12"], fact: "Hot water can freeze faster than cold water in some conditions.", extra: "It’s called the Mpemba effect. Scientists still argue why." },
  { bands: ["4-6", "7-9"], fact: "A cloud can weigh as much as 100 elephants.", extra: "The water is spread out as tiny droplets, so it floats." },
  { bands: ["10-12"], fact: "Time passes a tiny bit faster for your head than for your feet.", extra: "Earth’s gravity slows clocks — GPS satellites correct for this." },
  { bands: ["7-9", "10-12"], fact: "Most of the oxygen you breathe comes from ocean plankton, not just forests.", extra: "Tiny cyanobacteria and algae do a huge share of photosynthesis." },
  { bands: ["4-6"], fact: "Your tongue print is as unique as your fingerprint.", extra: "Nobody else has one quite like yours." },
  { bands: ["7-9"], fact: "The first computer bug was a real moth.", extra: "It was taped into a logbook in 1947 after it jammed a relay." },
  { bands: ["10-12"], fact: "A light-year is a distance, not a time — about 6 trillion miles.", extra: "It’s how far light travels in one Earth year." },
];

export function pickFact(band: AgeBand, rng: () => number): FactItem {
  const pool = FACTS.filter((f) => f.bands.includes(band));
  const f = pick(rng, pool.length ? pool : FACTS);
  return { fact: f.fact, extra: f.extra };
}
