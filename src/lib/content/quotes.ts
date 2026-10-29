import type { AgeBand } from "../types";
import { pick } from "../rng";
import { pickRotating, type RotateKey } from "./rotate";

export interface QuoteItem {
  quote: string;
  author: string;
  /** Who they were, in a few words. */
  role: string;
  /** Kid-friendly "what it means". */
  meaning: string;
}

interface QuoteEntry extends QuoteItem {
  bands: AgeBand[];
}

/**
 * Only quotes traceable to a primary source (speech, letter, book, poem). If a line cannot be sourced, it does not go in — never add quotes from memory.
 * Popular-but-misattributed lines ("Be the change…", "Well-behaved women…") are deliberately left out.
 */
const A: AgeBand[] = ["4-6", "7-9", "10-12"];
const M: AgeBand[] = ["7-9", "10-12"];
const O: AgeBand[] = ["10-12"];

export const QUOTES: QuoteEntry[] = [
  { bands: A, quote: "The only thing we have to fear is fear itself.", author: "Franklin D. Roosevelt", role: "U.S. president, 1933", meaning: "Being scared of something can be worse than the thing itself." },
  { bands: A, quote: "That's one small step for man, one giant leap for mankind.", author: "Neil Armstrong", role: "First person on the Moon, 1969", meaning: "One careful step can start something huge." },
  { bands: A, quote: "I have a dream.", author: "Martin Luther King Jr.", role: "Civil rights leader, 1963", meaning: "He pictured a fair world and worked to make it real." },
  { bands: A, quote: "I think I can, I think I can.", author: "Watty Piper, The Little Engine That Could", role: "Children's author, 1930", meaning: "Believing you can try is the first part of climbing the hill." },
  { bands: A, quote: "Imagination is more important than knowledge.", author: "Albert Einstein", role: "Physicist, 1929", meaning: "Knowing facts helps, but dreaming up new ideas moves the world." },
  { bands: A, quote: "The best way out is always through.", author: "Robert Frost", role: "Poet, 1914", meaning: "Facing a hard thing is better than hiding from it." },
  { bands: A, quote: "The journey of a thousand miles begins with a single step.", author: "Lao Tzu", role: "Chinese philosopher", meaning: "Every big trip starts with one small step." },
  { bands: A, quote: "A person's a person, no matter how small.", author: "Dr. Seuss, Horton Hears a Who!", role: "Children's author, 1954", meaning: "Everyone counts, big or little." },
  { bands: A, quote: "I am not afraid of storms, for I am learning how to sail my ship.", author: "Louisa May Alcott, Little Women", role: "Author, 1868", meaning: "Hard times are a chance to get better at steering." },
  { bands: A, quote: "Try to be a rainbow in someone's cloud.", author: "Maya Angelou", role: "Poet and author", meaning: "Brighten someone's gloomy day." },
  { bands: A, quote: "Fall seven times, stand up eight.", author: "Japanese proverb", role: "Old saying", meaning: "Keep getting back up." },
  { bands: M, quote: "I am the master of my fate, I am the captain of my soul.", author: "William Ernest Henley, Invictus", role: "Poet, 1888", meaning: "You steer your own life, even when things are rough." },
  { bands: M, quote: "Give me liberty, or give me death!", author: "Patrick Henry", role: "American patriot, 1775", meaning: "He felt freedom was worth fighting for." },
  { bands: M, quote: "Government of the people, by the people, for the people, shall not perish from the earth.", author: "Abraham Lincoln", role: "U.S. president, Gettysburg Address, 1863", meaning: "Ordinary people should run their own country." },
  { bands: M, quote: "Ask not what your country can do for you; ask what you can do for your country.", author: "John F. Kennedy", role: "U.S. president, 1961", meaning: "Don't only take; help too." },
  { bands: M, quote: "We choose to go to the Moon… not because they are easy, but because they are hard.", author: "John F. Kennedy", role: "U.S. president, 1962", meaning: "Hard goals make people stretch and grow." },
  { bands: M, quote: "Genius is one percent inspiration and ninety-nine percent perspiration.", author: "Thomas Edison", role: "Inventor", meaning: "Great ideas still need lots of hard work." },
  { bands: M, quote: "The important thing is not to stop questioning.", author: "Albert Einstein", role: "Physicist, 1955", meaning: "Curiosity is how we learn." },
  { bands: M, quote: "If I have seen further, it is by standing on the shoulders of giants.", author: "Isaac Newton", role: "Scientist, 1675 letter", meaning: "We build on what clever people before us figured out." },
  { bands: M, quote: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela", role: "President of South Africa, 2003", meaning: "Learning gives you the power to make things better." },
  { bands: M, quote: "One child, one teacher, one book, one pen can change the world.", author: "Malala Yousafzai", role: "Education activist, UN speech 2013", meaning: "Small things like a book and a pencil can have a huge effect." },
  { bands: M, quote: "Well done is better than well said.", author: "Benjamin Franklin", role: "Founding Father, Poor Richard's Almanack", meaning: "Doing something good beats talking about it." },
  { bands: M, quote: "Never give in—never, never, never, never—in nothing, great or small, large or petty.", author: "Winston Churchill", role: "British prime minister, 1941", meaning: "Keep going even when it's hard." },
  { bands: M, quote: "The only way to do great work is to love what you do.", author: "Steve Jobs", role: "Apple co-founder, 2005", meaning: "You do your best work on things you care about." },
  { bands: M, quote: "Speak softly and carry a big stick; you will go far.", author: "Theodore Roosevelt", role: "U.S. president, 1901", meaning: "Be calm and polite, but be ready and strong." },
  { bands: O, quote: "We hold these truths to be self-evident, that all men are created equal.", author: "Thomas Jefferson", role: "Declaration of Independence, 1776", meaning: "The founders said everyone has the same basic rights." },
  { bands: O, quote: "I have nothing to offer but blood, toil, tears and sweat.", author: "Winston Churchill", role: "British prime minister, 1940", meaning: "He promised hard work and sacrifice, not an easy win." },
  { bands: O, quote: "Injustice anywhere is a threat to justice everywhere.", author: "Martin Luther King Jr.", role: "Letter from Birmingham Jail, 1963", meaning: "Unfairness to one group puts everyone's fairness at risk." },
  { bands: O, quote: "I can't go back to yesterday, because I was a different person then.", author: "Lewis Carroll, Alice's Adventures in Wonderland", role: "Author, 1865", meaning: "We keep changing as we learn." },
  { bands: O, quote: "The unexamined life is not worth living.", author: "Socrates (as written by Plato)", role: "Ancient Greek philosopher", meaning: "Stop and think about how you live." },
  { bands: O, quote: "I think, therefore I am.", author: "René Descartes", role: "French philosopher, 1637", meaning: "If you can doubt and think, you must exist." },
  { bands: O, quote: "A ship in harbor is safe, but that is not what ships are built for.", author: "John A. Shedd", role: "Writer, 1928", meaning: "You grow by taking sensible risks." },
];

export function pickQuoteForDay(band: AgeBand, key: RotateKey): QuoteItem {
  const pool = QUOTES.filter((q) => q.bands.includes(band));
  const q = pickRotating(pool.length ? pool : QUOTES, key, `quote|${band}`);
  return { quote: q.quote, author: q.author, role: q.role, meaning: q.meaning };
}

export function pickQuote(band: AgeBand, rng: () => number): QuoteItem {
  const pool = QUOTES.filter((q) => q.bands.includes(band));
  const q = pick(rng, pool.length ? pool : QUOTES);
  return { quote: q.quote, author: q.author, role: q.role, meaning: q.meaning };
}
