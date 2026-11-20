import type { AgeBand } from "../types";
import type { LiveNewsEntry } from "./news";

/**
 * Gentle, true, evergreen stories for the public sample PDF.
 * Used only when that morning's live kid-safe feed is empty.
 * Real dispatches still skip a news card rather than invent a headline.
 */
const SAMPLE_WORLD: Record<AgeBand, Omit<LiveNewsEntry, "bands">> = {
  "4-6": {
    headline: "Penguins take turns staying warm",
    location: "Antarctica",
    blurb:
      "Emperor penguins stand close together when the wind is cold. Birds in the middle get cozy, then they shuffle so friends on the edge get a turn too.",
    wonder: "A dad penguin balances the egg on his feet so it never touches the ice.",
  },
  "7-9": {
    headline: "Borrow a telescope like a book",
    location: "Public libraries",
    blurb:
      "Some libraries let you check out a telescope the way you check out a story. You take it home, wait for a clear night, and look at the Moon from the yard.",
    wonder: "The Moon is close enough that a small telescope shows its craters.",
  },
  "10-12": {
    headline: "Astronauts grow lettuce above Earth",
    location: "International Space Station",
    blurb:
      "On the space station, astronauts grow red lettuce under special lamps. They water the plants, pick a few leaves, and taste a space salad.",
    wonder: "The station circles Earth about 16 times in a single day.",
  },
};

export function sampleWorldNews(band: AgeBand): LiveNewsEntry[] {
  return [{ ...SAMPLE_WORLD[band], bands: [band] }];
}
