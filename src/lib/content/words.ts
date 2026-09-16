import type { AgeBand, WordItem } from "../types";
import { pick } from "../rng";

interface WordEntry {
  word: string;
  phonetic: string;
  pos: string;
  definition: string;
  example: string;
  tryThis: string;
  bands: AgeBand[];
}

const WORDS: WordEntry[] = [
  { word: "curious", phonetic: "KYUR-ee-us", pos: "adj.", bands: ["4-6", "7-9"], definition: "Wanting to learn or know more.", example: "The curious kitten peeked into every box.", tryThis: "Ask one question you have never asked before." },
  { word: "brave", phonetic: "BRAYV", pos: "adj.", bands: ["4-6", "7-9"], definition: "Ready to try something hard or a little scary.", example: "She felt brave when she tried the tall slide.", tryThis: "Try one small new thing today." },
  { word: "gentle", phonetic: "JEN-tul", pos: "adj.", bands: ["4-6"], definition: "Soft and careful, not rough.", example: "He gave the puppy a gentle pat.", tryThis: "Do one thing extra-gently — a door, a hug, a crayon." },
  { word: "sparkle", phonetic: "SPAR-kul", pos: "verb", bands: ["4-6"], definition: "To shine with little flashes of light.", example: "Dewdrops sparkle on the grass at sunrise.", tryThis: "Find three things that sparkle." },
  { word: "giggle", phonetic: "GIG-ul", pos: "verb", bands: ["4-6"], definition: "A short, quiet laugh.", example: "The joke made the whole table giggle.", tryThis: "Tell someone a tiny joke at breakfast." },
  { word: "cozy", phonetic: "KOH-zee", pos: "adj.", bands: ["4-6", "7-9"], definition: "Warm, soft, and comfortable.", example: "We read under a cozy blanket.", tryThis: "Make a cozy reading nest for later." },
  { word: "explore", phonetic: "ek-SPLOR", pos: "verb", bands: ["4-6", "7-9"], definition: "To look around and discover new things.", example: "They explored the backyard after breakfast.", tryThis: "Explore one new corner of your block." },
  { word: "imagine", phonetic: "ih-MAJ-in", pos: "verb", bands: ["4-6", "7-9"], definition: "To picture something in your mind.", example: "Imagine a rocket made of cardboard and tape.", tryThis: "Draw something you imagined this morning." },
  { word: "kindness", phonetic: "KIND-ness", pos: "noun", bands: ["4-6", "7-9"], definition: "Being friendly and helpful to others.", example: "Kindness is sharing the last pancake.", tryThis: "Do one kind thing before lunch." },
  { word: "whisper", phonetic: "WIS-per", pos: "verb", bands: ["4-6", "7-9"], definition: "To speak very softly.", example: "We whisper so we don’t wake the baby.", tryThis: "Whisper a secret animal sound to someone." },
  { word: "balance", phonetic: "BAL-unce", pos: "noun", bands: ["4-6", "7-9"], definition: "Keeping steady so you don’t tip over.", example: "She found her balance on the curb like a tightrope.", tryThis: "Balance on one foot while you wait for toast." },
  { word: "invent", phonetic: "in-VENT", pos: "verb", bands: ["4-6", "7-9"], definition: "To make something new that didn’t exist before.", example: "They invented a game with chalk and sidewalk squares.", tryThis: "Invent a better breakfast tool on paper." },
  { word: "rhythm", phonetic: "RITH-um", pos: "noun", bands: ["4-6", "7-9"], definition: "A repeating pattern of sounds or beats.", example: "Clap the rhythm: one-two, one-two.", tryThis: "Clap a rhythm and ask someone to copy it." },
  { word: "sturdy", phonetic: "STUR-dee", pos: "adj.", bands: ["7-9"], definition: "Strong and not easily broken.", example: "The sturdy chair held all three stuffed animals.", tryThis: "Name two sturdy things and two fragile things." },
  { word: "marvel", phonetic: "MAR-vul", pos: "verb", bands: ["7-9", "10-12"], definition: "To feel wonder or amazement.", example: "We marveled at the bright comet trail.", tryThis: "Marvel at one ordinary kitchen tool." },
  { word: "observe", phonetic: "ub-ZURV", pos: "verb", bands: ["7-9", "10-12"], definition: "To watch carefully and notice details.", example: "Scientists observe birds to learn their habits.", tryThis: "Observe a cloud for one minute and sketch it." },
  { word: "persist", phonetic: "per-SIST", pos: "verb", bands: ["7-9", "10-12"], definition: "To keep going even when something is hard.", example: "She persisted until the maze was solved.", tryThis: "Name a time you persisted this week." },
  { word: "harvest", phonetic: "HAR-vist", pos: "verb", bands: ["7-9"], definition: "To gather crops that are ready to eat.", example: "In autumn we harvest apples from the orchard.", tryThis: "Name three foods that grow on plants." },
  { word: "orbit", phonetic: "OR-bit", pos: "noun", bands: ["7-9", "10-12"], definition: "The path one object takes around another in space.", example: "Earth completes one orbit of the Sun each year.", tryThis: "Walk an orbit around the table." },
  { word: "fragile", phonetic: "FRAJ-ul", pos: "adj.", bands: ["7-9", "10-12"], definition: "Easy to break or damage.", example: "Handle the fragile shell with two hands.", tryThis: "Carry something fragile with two hands today." },
  { word: "migrate", phonetic: "MY-grate", pos: "verb", bands: ["7-9", "10-12"], definition: "To travel from one place to another, often with the seasons.", example: "Geese migrate south when nights grow cold.", tryThis: "Name two animals that migrate and guess why." },
  { word: "ancient", phonetic: "AYN-chent", pos: "adj.", bands: ["7-9", "10-12"], definition: "Very old — from long ago.", example: "Ancient maps show seas that sailors once feared.", tryThis: "Find the oldest object in the kitchen." },
  { word: "delight", phonetic: "dih-LITE", pos: "noun", bands: ["7-9"], definition: "Great joy or pleasure.", example: "The surprise pancake stack was a delight.", tryThis: "Plan one small delight for someone else." },
  { word: "compass", phonetic: "KUM-pus", pos: "noun", bands: ["7-9", "10-12"], definition: "A tool that points toward north to help you find your way.", example: "With a compass, hikers know which way is north.", tryThis: "Face north if you can. What’s in front of you?" },
  { word: "habitat", phonetic: "HAB-ih-tat", pos: "noun", bands: ["7-9", "10-12"], definition: "The natural home of a plant or animal.", example: "A coral reef is a busy ocean habitat.", tryThis: "Describe the habitat of a squirrel near you." },
  { word: "nourish", phonetic: "NUR-ish", pos: "verb", bands: ["7-9", "10-12"], definition: "To give food or care that helps something grow.", example: "Rain and sunlight nourish the garden.", tryThis: "What nourishes you before school?" },
  { word: "pioneer", phonetic: "pie-uh-NEER", pos: "noun", bands: ["7-9", "10-12"], definition: "Someone among the first to try a new place or idea.", example: "Early pilots were pioneers of flight.", tryThis: "Invent a pioneer rule for your kitchen." },
  { word: "quiver", phonetic: "KWIV-er", pos: "verb", bands: ["7-9"], definition: "To shake slightly with cold, fear, or excitement.", example: "Leaves quiver when a breeze passes through.", tryThis: "Make your hand quiver like a leaf, then be still." },
  { word: "thrive", phonetic: "THRIVE", pos: "verb", bands: ["7-9", "10-12"], definition: "To grow strong and healthy.", example: "Seedlings thrive with water and care.", tryThis: "What helps you thrive on a school morning?" },
  { word: "unique", phonetic: "yoo-NEEK", pos: "adj.", bands: ["7-9", "10-12"], definition: "One of a kind; not like anything else.", example: "Your fingerprint is unique — only yours.", tryThis: "Name one unique thing about your breakfast." },
  { word: "patience", phonetic: "PAY-shunce", pos: "noun", bands: ["7-9", "10-12"], definition: "Waiting calmly without getting upset.", example: "Patience helped him finish the tricky puzzle.", tryThis: "Practice waiting for ten slow breaths." },
  { word: "flourish", phonetic: "FLUR-ish", pos: "verb", bands: ["10-12"], definition: "To grow well or do very well.", example: "Sunflowers flourish in long summer days.", tryThis: "Where do you flourish most — indoors or outside?" },
  { word: "ingenious", phonetic: "in-JEEN-yus", pos: "adj.", bands: ["10-12"], definition: "Clever and inventive.", example: "An ingenious paper clip held the kite together.", tryThis: "Invent an ingenious fix for a tiny annoyance." },
  { word: "resilient", phonetic: "rih-ZIL-yunt", pos: "adj.", bands: ["10-12"], definition: "Able to recover quickly from trouble.", example: "Resilient trees bend in the wind and stand again.", tryThis: "Name a time you were resilient this month." },
  { word: "hypothesis", phonetic: "hy-POTH-uh-sis", pos: "noun", bands: ["10-12"], definition: "An idea you can test with an experiment.", example: "Our hypothesis: ice melts faster in warm water.", tryThis: "Write a hypothesis you could test in the kitchen." },
  { word: "eclipse", phonetic: "ih-KLIPS", pos: "noun", bands: ["10-12"], definition: "When one space object blocks light from another.", example: "During a solar eclipse, the Moon covers the Sun.", tryThis: "Use a coin to eclipse a lamp from your eye (don’t stare at the Sun)." },
  { word: "luminous", phonetic: "LOO-mih-nus", pos: "adj.", bands: ["10-12"], definition: "Giving off light; glowing.", example: "Fireflies look luminous on summer evenings.", tryThis: "Name three luminous things." },
  { word: "meticulous", phonetic: "muh-TIK-yuh-lus", pos: "adj.", bands: ["10-12"], definition: "Very careful about small details.", example: "A meticulous builder checks every brick.", tryThis: "Be meticulous about packing your bag today." },
  { word: "optimistic", phonetic: "op-tih-MIS-tik", pos: "adj.", bands: ["10-12"], definition: "Expecting good things to happen.", example: "An optimistic coach believes the team can improve.", tryThis: "Write one optimistic sentence about today." },
  { word: "silhouette", phonetic: "sil-oo-ET", pos: "noun", bands: ["10-12"], definition: "A dark outline against a brighter background.", example: "We saw the bird’s silhouette against the sunset.", tryThis: "Catch a silhouette against a window." },
  { word: "catalyst", phonetic: "KAT-uh-list", pos: "noun", bands: ["10-12"], definition: "Something that starts or speeds up a change.", example: "A good question can be the catalyst for a whole science fair.", tryThis: "What was the catalyst for a good habit you have?" },
  { word: "equator", phonetic: "ih-KWAY-ter", pos: "noun", bands: ["7-9", "10-12"], definition: "An imaginary line around the middle of Earth.", example: "Countries on the equator stay warm all year.", tryThis: "Guess whether you are closer to the equator or the North Pole." },
  { word: "fossils", phonetic: "FOSS-ulz", pos: "noun", bands: ["4-6", "7-9"], definition: "Traces of plants or animals from long ago, saved in rock.", example: "We found fossil seashells in a stone at the park.", tryThis: "Press a leaf in clay to make a fake fossil." },
  { word: "nectar", phonetic: "NEK-ter", pos: "noun", bands: ["4-6", "7-9"], definition: "Sweet liquid inside flowers that bees drink.", example: "The hummingbird sipped nectar from the red bloom.", tryThis: "Look for a flower and imagine its nectar." },
  { word: "horizon", phonetic: "huh-RY-zun", pos: "noun", bands: ["7-9", "10-12"], definition: "The line where the sky seems to meet the land or sea.", example: "A ship disappeared over the horizon.", tryThis: "If you can, look for the horizon. If not, draw it." },
  { word: "amplify", phonetic: "AM-plih-fy", pos: "verb", bands: ["10-12"], definition: "To make a sound or idea stronger or louder.", example: "A megaphone amplifies a cheer so the whole field can hear.", tryThis: "Amplify a kind idea — tell two people." },
  { word: "camouflage", phonetic: "KAM-uh-flahzh", pos: "noun", bands: ["7-9", "10-12"], definition: "Colors or shapes that help something hide.", example: "A stick insect’s camouflage makes it look like a twig.", tryThis: "Find something whose color hides it in the room." },
  { word: "estimate", phonetic: "ES-tih-mit", pos: "verb", bands: ["7-9", "10-12"], definition: "To make a smart guess using what you know.", example: "Estimate how many steps to the mailbox, then count.", tryThis: "Estimate the number of spoons in the drawer." },
  { word: "photosynthesis", phonetic: "foh-toh-SIN-thuh-sis", pos: "noun", bands: ["10-12"], definition: "How plants make food from light, water, and carbon dioxide.", example: "Without photosynthesis, we would not have oxygen-rich air.", tryThis: "Thank a leaf. Say what it took in and gave off." },
  { word: "algorithm", phonetic: "AL-guh-rith-um", pos: "noun", bands: ["10-12"], definition: "A step-by-step set of instructions for solving a problem.", example: "A maze-solving algorithm can be as simple as ‘always try left.’", tryThis: "Write an algorithm for making breakfast." },
];

export function pickWord(band: AgeBand, rng: () => number): WordItem {
  const pool = WORDS.filter((w) => w.bands.includes(band));
  const w = pick(rng, pool.length ? pool : WORDS);
  return {
    word: w.word,
    phonetic: w.phonetic,
    pos: w.pos,
    definition: w.definition,
    example: w.example,
    tryThis: w.tryThis,
  };
}
