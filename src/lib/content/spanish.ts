import type { AgeBand } from "../types";
import { pick } from "../rng";

export interface SpanishItem {
  spanish: string;
  phonetic: string;
  english: string;
  example: string;
}

interface SpanishEntry extends SpanishItem {
  bands: AgeBand[];
}

const WORDS: SpanishEntry[] = [
  { bands: ["4-6"], spanish: "hola", phonetic: "OH-lah", english: "hello", example: "Say hola to someone at breakfast." },
  { bands: ["4-6"], spanish: "gracias", phonetic: "GRAH-see-ahs", english: "thank you", example: "Gracias for the pancakes!" },
  { bands: ["4-6"], spanish: "agua", phonetic: "AH-gwah", english: "water", example: "¿Agua, por favor?" },
  { bands: ["4-6"], spanish: "sol", phonetic: "sohl", english: "sun", example: "El sol is bright this morning." },
  { bands: ["4-6"], spanish: "gato", phonetic: "GAH-toh", english: "cat", example: "Draw a gato on the margin." },
  { bands: ["4-6", "7-9"], spanish: "amigo", phonetic: "ah-MEE-goh", english: "friend (boy)", example: "Be a good amigo today." },
  { bands: ["4-6", "7-9"], spanish: "amiga", phonetic: "ah-MEE-gah", english: "friend (girl)", example: "Invite an amiga to play." },
  { bands: ["4-6", "7-9"], spanish: "libro", phonetic: "LEE-broh", english: "book", example: "Pack one libro in your bag." },
  { bands: ["4-6", "7-9"], spanish: "casa", phonetic: "KAH-sah", english: "house / home", example: "This casa smells like toast." },
  { bands: ["4-6", "7-9"], spanish: "pan", phonetic: "pahn", english: "bread", example: "Pass the pan, please." },
  { bands: ["7-9"], spanish: "escuela", phonetic: "es-KWEH-lah", english: "school", example: "On the way to escuela, count red cars." },
  { bands: ["7-9"], spanish: "manzana", phonetic: "mahn-SAH-nah", english: "apple", example: "A manzana a day…" },
  { bands: ["7-9", "10-12"], spanish: "ventana", phonetic: "ven-TAH-nah", english: "window", example: "Look out the ventana." },
  { bands: ["7-9"], spanish: "perro", phonetic: "PEH-rroh", english: "dog", example: "The perro wants a walk." },
  { bands: ["7-9", "10-12"], spanish: "feliz", phonetic: "feh-LEES", english: "happy", example: "¡Qué día feliz!" },
  { bands: ["7-9"], spanish: "noche", phonetic: "NOH-cheh", english: "night", example: "Buenas noches later — buenos días now." },
  { bands: ["7-9", "10-12"], spanish: "estrellas", phonetic: "es-TREH-yahs", english: "stars", example: "Count estrellas after dark." },
  { bands: ["7-9", "10-12"], spanish: "camino", phonetic: "kah-MEE-noh", english: "path / road", example: "Which camino to the bus?" },
  { bands: ["10-12"], spanish: "biblioteca", phonetic: "bee-blee-oh-TEH-kah", english: "library", example: "Meet me at the biblioteca." },
  { bands: ["10-12"], spanish: "desayuno", phonetic: "deh-sah-YOO-noh", english: "breakfast", example: "Desayuno is the most important strip of the day." },
  { bands: ["10-12"], spanish: "curiosidad", phonetic: "koo-ree-oh-see-DAHD", english: "curiosity", example: "Curiosidad opens doors." },
  { bands: ["10-12"], spanish: "valiente", phonetic: "vah-lee-EN-teh", english: "brave", example: "Sé valiente with a new word." },
  { bands: ["10-12"], spanish: "tiempo", phonetic: "tee-EM-poh", english: "time / weather", example: "¿Qué tiempo hace hoy?" },
  { bands: ["10-12"], spanish: "siempre", phonetic: "see-EM-preh", english: "always", example: "Siempre try one Spanish word out loud." },
  { bands: ["4-6"], spanish: "sí", phonetic: "see", english: "yes", example: "Sí, I’ll try the new fruit." },
  { bands: ["4-6"], spanish: "no", phonetic: "noh", english: "no", example: "No means no — politely." },
  { bands: ["4-6", "7-9"], spanish: "rojo", phonetic: "ROH-hoh", english: "red", example: "Find something rojo." },
  { bands: ["4-6", "7-9"], spanish: "azul", phonetic: "ah-SOOL", english: "blue", example: "Is the sky azul today?" },
  { bands: ["7-9", "10-12"], spanish: "familia", phonetic: "fah-MEE-lee-ah", english: "family", example: "Who’s in your familia this morning?" },
  { bands: ["7-9"], spanish: "zapato", phonetic: "sah-PAH-toh", english: "shoe", example: "Find your other zapato." },
  { bands: ["10-12"], spanish: "pregunta", phonetic: "preh-GOON-tah", english: "question", example: "Ask one buena pregunta today." },
  { bands: ["4-6", "7-9"], spanish: "leche", phonetic: "LEH-cheh", english: "milk", example: "Leche in the cereal bowl." },
  { bands: ["7-9", "10-12"], spanish: "mundo", phonetic: "MOON-doh", english: "world", example: "Good morning, mundo." },
  { bands: ["10-12"], spanish: "aprender", phonetic: "ah-pren-DEHR", english: "to learn", example: "Hoy voy a aprender una palabra." },
];

export function pickSpanish(band: AgeBand, rng: () => number): SpanishItem {
  const pool = WORDS.filter((w) => w.bands.includes(band));
  const w = pick(rng, pool.length ? pool : WORDS);
  return {
    spanish: w.spanish,
    phonetic: w.phonetic,
    english: w.english,
    example: w.example,
  };
}
