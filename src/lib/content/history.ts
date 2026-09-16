import type { AgeBand } from "../types";
import { pick } from "../rng";
import { monthName, parseISODate } from "../dates";

interface HistoryEntry {
  month: number;
  day: number;
  year: string;
  bands: AgeBand[];
  text: string;
}

interface FallbackEntry {
  bands: AgeBand[];
  text: string;
}

const HISTORY: HistoryEntry[] = [
  { month: 1, day: 1, year: "1863", bands: ["7-9", "10-12"], text: "The Emancipation Proclamation took effect, declaring millions of enslaved people in the Confederacy to be free." },
  { month: 1, day: 17, year: "1706", bands: ["7-9", "10-12"], text: "Benjamin Franklin was born in Boston. He loved experiments, libraries, and asking better questions." },
  { month: 2, day: 4, year: "2004", bands: ["4-6", "7-9", "10-12"], text: "Facebook launched from a college dorm. A reminder that huge things can start small — and that tools need careful rules." },
  { month: 2, day: 11, year: "1990", bands: ["7-9", "10-12"], text: "Nelson Mandela walked free after 27 years in prison, a turning point for South Africa." },
  { month: 2, day: 20, year: "1962", bands: ["4-6", "7-9", "10-12"], text: "John Glenn became the first American to orbit Earth, circling the planet three times in Friendship 7." },
  { month: 3, day: 10, year: "1876", bands: ["4-6", "7-9", "10-12"], text: "Alexander Graham Bell made the first telephone call: “Mr. Watson, come here — I want to see you.”" },
  { month: 3, day: 15, year: "44 BCE", bands: ["10-12"], text: "Julius Caesar was assassinated in Rome on the Ides of March — a lesson in power, loyalty, and history’s long memory." },
  { month: 4, day: 12, year: "1961", bands: ["4-6", "7-9", "10-12"], text: "Yuri Gagarin became the first person in space, orbiting Earth in Vostok 1." },
  { month: 4, day: 22, year: "1970", bands: ["4-6", "7-9", "10-12"], text: "The first Earth Day brought millions of people outside to talk about clean air, water, and taking care of the planet." },
  { month: 5, day: 5, year: "1961", bands: ["7-9", "10-12"], text: "Alan Shepard became the first American in space, a 15-minute flight that opened a door." },
  { month: 5, day: 25, year: "1961", bands: ["7-9", "10-12"], text: "President Kennedy asked the United States to send a person to the Moon — and bring them home — before the decade was out." },
  { month: 6, day: 4, year: "1919", bands: ["7-9", "10-12"], text: "The U.S. Senate passed the 19th Amendment, a big step toward women winning the right to vote." },
  { month: 6, day: 18, year: "1983", bands: ["4-6", "7-9", "10-12"], text: "Sally Ride became the first American woman in space, aboard the shuttle Challenger." },
  { month: 7, day: 4, year: "1776", bands: ["7-9", "10-12"], text: "The Declaration of Independence was adopted in Philadelphia — a letter to the world about freedom and self-government." },
  { month: 7, day: 20, year: "1969", bands: ["4-6", "7-9", "10-12"], text: "Neil Armstrong and Buzz Aldrin walked on the Moon. The world watched on grainy black-and-white TV." },
  { month: 8, day: 18, year: "1920", bands: ["7-9", "10-12"], text: "The 19th Amendment was ratified, and American women won the vote." },
  { month: 8, day: 28, year: "1963", bands: ["7-9", "10-12"], text: "Martin Luther King Jr. gave the “I Have a Dream” speech at the March on Washington." },
  { month: 9, day: 8, year: "1966", bands: ["4-6", "7-9", "10-12"], text: "Star Trek first aired. A TV show about exploring space also quietly argued that people of every kind belong on the bridge." },
  { month: 9, day: 16, year: "1810", bands: ["4-6", "7-9", "10-12"], text: "Mexico’s cry for independence rang out — still celebrated today as Mexican Independence Day." },
  { month: 9, day: 28, year: "1928", bands: ["7-9", "10-12"], text: "Alexander Fleming noticed mold killing bacteria in a dish. That accident became penicillin." },
  { month: 10, day: 4, year: "1957", bands: ["7-9", "10-12"], text: "The Soviet Union launched Sputnik 1, the first satellite, and the Space Age began with a beep." },
  { month: 10, day: 24, year: "1945", bands: ["10-12"], text: "The United Nations was founded, an attempt to settle fights with talking instead of only with war." },
  { month: 11, day: 9, year: "1989", bands: ["7-9", "10-12"], text: "The Berlin Wall opened. Families who had been split for decades walked through checkpoints and hugged." },
  { month: 11, day: 20, year: "1989", bands: ["7-9", "10-12"], text: "The United Nations adopted the Convention on the Rights of the Child — a promise that kids matter in the law." },
  { month: 12, day: 1, year: "1955", bands: ["7-9", "10-12"], text: "Rosa Parks was arrested in Montgomery, Alabama, for refusing to give up her bus seat — a spark for the civil rights movement." },
  { month: 12, day: 17, year: "1903", bands: ["4-6", "7-9", "10-12"], text: "The Wright brothers flew at Kitty Hawk, North Carolina. The first flight lasted 12 seconds." },
  { month: 1, day: 31, year: "1961", bands: ["4-6", "7-9"], text: "Ham the chimpanzee flew to space and came home safely, a brave (and carefully watched) test before people went." },
  { month: 3, day: 3, year: "1931", bands: ["4-6", "7-9"], text: "“The Star-Spangled Banner” became the U.S. national anthem." },
  { month: 4, day: 26, year: "1986", bands: ["10-12"], text: "The Chernobyl nuclear plant exploded. The world learned, painfully, how careful big technology must be." },
  { month: 5, day: 29, year: "1953", bands: ["7-9", "10-12"], text: "Edmund Hillary and Tenzing Norgay reached the summit of Mount Everest." },
  { month: 6, day: 23, year: "1868", bands: ["4-6", "7-9", "10-12"], text: "Christopher Latham Sholes received a patent that led to the typewriter — ancestor of every keyboard you tap." },
  { month: 7, day: 6, year: "1885", bands: ["7-9", "10-12"], text: "Louis Pasteur successfully tested a rabies vaccine on a boy named Joseph Meister." },
  { month: 8, day: 6, year: "1991", bands: ["10-12"], text: "The World Wide Web became public. A research tool turned into the place you are reading this product story." },
  { month: 9, day: 3, year: "1976", bands: ["4-6", "7-9"], text: "The Viking 2 lander touched down on Mars and started sending pictures of rust-red rocks." },
  { month: 10, day: 31, year: "1517", bands: ["10-12"], text: "Martin Luther posted his 95 Theses in Wittenberg, a moment that reshaped European religion — usually taught as Halloween-adjacent history." },
  { month: 11, day: 4, year: "1922", bands: ["7-9", "10-12"], text: "Howard Carter found the steps to Tutankhamun’s tomb, and a boy king’s grave became world news." },
  { month: 12, day: 14, year: "1911", bands: ["7-9", "10-12"], text: "Roald Amundsen’s team reached the South Pole, a race across ice that took planning more than luck." },
];

const FALLBACK: FallbackEntry[] = [
  { bands: ["4-6", "7-9"], text: "In 1969, a computer network called ARPANET sent its first message. It crashed after two letters — “LO” — and then the future of the internet kept going." },
  { bands: ["4-6", "7-9", "10-12"], text: "In 1836, the first patent for a cookstove that looks a bit like today’s kitchen range was filed. Breakfast has been an invention all along." },
  { bands: ["7-9", "10-12"], text: "In 1905, a young patent clerk named Albert Einstein published ideas that changed how we think about light, time, and energy." },
  { bands: ["4-6", "7-9"], text: "In 1928, sliced bread was sold for the first time in Chillicothe, Missouri. “The greatest thing since sliced bread” had to start somewhere." },
  { bands: ["10-12"], text: "In 1953, Rosalind Franklin’s X-ray images helped reveal the shape of DNA — the twisted ladder that carries instructions for life." },
  { bands: ["4-6", "7-9", "10-12"], text: "In 1977, NASA launched the Voyager probes. They still send whispers from the edge of the solar system." },
];

export function pickHistory(
  iso: string,
  band: AgeBand,
  rng: () => number,
): { year: string; text: string; dateLabel: string } {
  const { month, day } = parseISODate(iso);
  const exact = HISTORY.filter((h) => h.month === month && h.day === day && h.bands.includes(band));
  const nearby = HISTORY.filter(
    (h) => h.month === month && Math.abs(h.day - day) <= 3 && h.bands.includes(band),
  );
  if (exact.length) {
    const chosen = pick(rng, exact);
    return {
      year: chosen.year,
      text: chosen.text,
      dateLabel: `${monthName(month)} ${day}`,
    };
  }
  if (nearby.length) {
    const chosen = pick(rng, nearby);
    return {
      year: chosen.year,
      text: chosen.text,
      dateLabel: `${monthName(chosen.month)} ${chosen.day}`,
    };
  }
  const fb = FALLBACK.filter((f) => f.bands.includes(band));
  const chosen = pick(rng, fb.length ? fb : FALLBACK);
  return {
    year: "",
    text: chosen.text,
    dateLabel: `${monthName(month)} ${day}`,
  };
}
