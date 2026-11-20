import type { AgeBand } from "../types";

export interface SampleNewsStory {
  bands: AgeBand[];
  headline: string;
  location: string;
  blurb: string;
  wonder: string;
}

/**
 * Printed on the public sample page when live news is unavailable (no API key,
 * or nothing kid-safe cached). Real dispatches never fall back to these.
 */
export const SAMPLE_NEWS: SampleNewsStory[] = [
  {
    bands: ["4-6", "7-9", "10-12"],
    headline: "Library opens a reading treehouse",
    location: "Portland",
    blurb: "A neighborhood library built a small treehouse full of cushions and picture books. Kids can climb up, pick a story, and read in the leaves.",
    wonder: "A group of flamingos is called a flamboyance.",
  },
  {
    bands: ["4-6", "7-9", "10-12"],
    headline: "Students grow lunch on the school roof",
    location: "Chicago",
    blurb: "A class planted tomatoes and herbs in boxes on the school roof. The cooks used the first harvest in Friday’s soup.",
    wonder: "Honey never spoils. Jars thousands of years old can still be eaten.",
  },
  {
    bands: ["4-6", "7-9", "10-12"],
    headline: "Park adds a butterfly path",
    location: "Austin",
    blurb: "Gardeners planted flowers that butterflies like to visit. Families can walk the path and count the colors they see.",
    wonder: "Butterflies taste with their feet.",
  },
];
