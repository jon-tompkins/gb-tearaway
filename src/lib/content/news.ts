import type { AgeBand, ModuleId } from "../types";
import { pick, shuffle } from "../rng";

export type NewsModuleId =
  | "news_world"
  | "news_national"
  | "news_city"
  | "news_tech"
  | "news_gamer";

export interface NewsItem {
  headline: string;
  /** Dateline location, newspaper-style (rendered in caps before the story). */
  location: string;
  blurb: string;
  wonder: string;
}

interface NewsEntry extends NewsItem {
  bands: AgeBand[];
}

const WORLD: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "Baby pandas play outside", location: "Chengdu, China", blurb: "Keepers shared photos of cubs tumbling in bamboo.", wonder: "Pandas eat for most of the day — almost like a snack marathon." },
  { bands: ["4-6", "7-9"], headline: "Whales sing across oceans", location: "Pacific Ocean", blurb: "Scientists recorded humpback songs traveling farther than expected.", wonder: "Some whale tunes last as long as a pop song." },
  { bands: ["7-9", "10-12"], headline: "New coral garden found", location: "Queensland, Australia", blurb: "Divers mapped a bright reef that was missing from older charts.", wonder: "Coral is an animal colony, not a plant." },
  { bands: ["7-9", "10-12"], headline: "Kids help plant a forest", location: "Nairobi, Kenya", blurb: "A school planted native trees along a dry creek.", wonder: "Young trees need water buddies — students take turns." },
  { bands: ["4-6"], headline: "Penguins get new nest boxes", location: "Cape Town, South Africa", blurb: "A coastal town built little houses so penguins can raise chicks safely.", wonder: "Penguin parents take turns warming the egg." },
  { bands: ["10-12"], headline: "Telescope spots a dusty planet nursery", location: "Atacama Desert, Chile", blurb: "Astronomers imaged rings of dust where new worlds may form.", wonder: "Our solar system once looked messy like that too." },
  { bands: ["4-6", "7-9"], headline: "Giant pumpkin contest smiles", location: "Ludwigsburg, Germany", blurb: "Farmers rolled enormous orange giants onto a scale for fun.", wonder: "The biggest ones can weigh more than a small car." },
  { bands: ["7-9", "10-12"], headline: "River otters return upstream", location: "London, England", blurb: "Cleaner water helped otters move back into a long-empty stretch of the Thames.", wonder: "Otters are a sign a river is getting healthier." },
  { bands: ["4-6", "7-9", "10-12"], headline: "Fireflies light a summer night", location: "Nagoya, Japan", blurb: "Families gathered to watch synchronized blinks over a field.", wonder: "Each species has its own blink code." },
  { bands: ["10-12"], headline: "Ancient seed sprouts again", location: "Tel Aviv, Israel", blurb: "Researchers coaxed a centuries-old seed into a green shoot.", wonder: "Seeds can wait quietly for the right conditions." },
];

const NATIONAL: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "National park trail reopens", location: "Everglades, Florida", blurb: "Rangers finished fixing a boardwalk so families can walk above the marsh.", wonder: "Boardwalks protect both boots and bird nests." },
  { bands: ["7-9", "10-12"], headline: "Science fair winners share inventions", location: "Columbus, Ohio", blurb: "Students showed gadgets that sort recycling and water plants.", wonder: "Many great ideas start as cardboard prototypes." },
  { bands: ["4-6"], headline: "Library book bikes roll out", location: "Portland, Oregon", blurb: "Librarians rode bikes stacked with picture books to neighborhood parks.", wonder: "A library can be a basket on two wheels." },
  { bands: ["7-9", "10-12"], headline: "Kids map local birds", location: "Austin, Texas", blurb: "A classroom counted backyard birds for a nationwide bird-watch day.", wonder: "Your window is a real research station." },
  { bands: ["4-6", "7-9"], headline: "Community garden harvest day", location: "Detroit, Michigan", blurb: "Neighbors picked tomatoes and shared recipes at a picnic table.", wonder: "One packet of seeds can feed a block." },
  { bands: ["10-12"], headline: "Young makers rebuild a playground", location: "Denver, Colorado", blurb: "Teens helped design inclusive swings and quieter corners.", wonder: "Good design asks: who felt left out before?" },
  { bands: ["4-6", "7-9"], headline: "School mural celebrates kindness", location: "Nashville, Tennessee", blurb: "Artists painted helpers, helpers’ helpers, and a smiling sun.", wonder: "Murals turn blank walls into shared stories." },
  { bands: ["7-9", "10-12"], headline: "Clean rivers challenge kicks off", location: "Pittsburgh, Pennsylvania", blurb: "Families collected litter along a creek and logged what they found.", wonder: "Plastic bottles are the usual suspects — bring gloves." },
  { bands: ["4-6"], headline: "Storytime under the stars", location: "Tucson, Arizona", blurb: "A park hosted bedtime books with flashlights and hot cocoa.", wonder: "Reading outside makes every page feel bigger." },
  { bands: ["10-12"], headline: "Student weather station goes live", location: "Des Moines, Iowa", blurb: "A middle school shared rainfall and wind data on a simple website.", wonder: "Local weather helps farmers and soccer coaches alike." },
];

const CITY: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "Playground gets a new slide", location: "Riverside Park", blurb: "City crews finished a shiny slide just in time for Saturday.", wonder: "First-ride rule: wait your turn, cheer loudly." },
  { bands: ["4-6"], headline: "Library puppy visit", location: "Central Library", blurb: "A gentle reading dog listened to kids practice out loud.", wonder: "Dogs don’t mind if you skip a word." },
  { bands: ["7-9", "10-12"], headline: "Farmers’ market finds a new corner", location: "Fountain Square", blurb: "Growers set up tents near the fountain with peaches and bread.", wonder: "Ask a farmer how long a peach took to ripen." },
  { bands: ["4-6", "7-9"], headline: "Crosswalk art brightens Main Street", location: "Main Street", blurb: "Volunteers painted colorful patterns so drivers notice kids.", wonder: "Art can be a safety tool." },
  { bands: ["7-9"], headline: "Hometown history walk", location: "Old Town", blurb: "A guide pointed out the old firehouse and the first bakery.", wonder: "Your block has chapters you can still see." },
  { bands: ["10-12"], headline: "Youth council picks a park project", location: "City Hall", blurb: "Kids voted for more shade trees and a chess table.", wonder: "Voting is practice for shaping a place." },
  { bands: ["4-6", "7-9"], headline: "Sidewalk chalk festival", location: "Elm Street", blurb: "Neighbors filled the pavement with dinosaurs and thank-you notes.", wonder: "Rain is the eraser — enjoy it today." },
  { bands: ["7-9", "10-12"], headline: "Bike lane practice day", location: "Lincoln School", blurb: "Helpers taught hand signals and helmet checks at the school lot.", wonder: "A bell is a polite “excuse me.”" },
  { bands: ["4-6"], headline: "Duck family crosses the pond path", location: "Millpond Path", blurb: "Traffic paused while ducklings toddled from grass to water.", wonder: "Patience is a hometown superpower." },
  { bands: ["10-12"], headline: "Repair café fixes toys for free", location: "Community Center", blurb: "Volunteers soldered, stitched, and glued instead of tossing.", wonder: "Fixing is inventing in reverse." },
];

const TECH: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "Robot vacuum learns a new map", location: "Tech desk", blurb: "A classroom bot drew the room as a simple floor plan.", wonder: "Robots “see” with sensors, not eyeballs." },
  { bands: ["7-9", "10-12"], headline: "Kids code a weather emoji app", location: "Code lab", blurb: "Students showed sun, cloud, and rain icons that change with data.", wonder: "Code is instructions you can rewrite." },
  { bands: ["4-6"], headline: "Talking picture book arrives", location: "Central Library", blurb: "A library tablet read stories aloud when kids tapped pictures.", wonder: "You can still turn pages the old way too." },
  { bands: ["7-9", "10-12"], headline: "Tiny satellite built by students", location: "Cape Canaveral, Florida", blurb: "A cube the size of a tissue box headed to a test launch.", wonder: "Space hardware can start on a classroom bench." },
  { bands: ["4-6", "7-9"], headline: "3D printer makes spare game pieces", location: "Makerspace", blurb: "A makerspace reprinted lost meeples so games stay playable.", wonder: "Sharing designs helps other kids fix sets too." },
  { bands: ["10-12"], headline: "Open-source telescope tracker", location: "Online", blurb: "Hobbyists published free plans to keep a scope pointed at stars.", wonder: "Open source means you can peek under the hood." },
  { bands: ["7-9"], headline: "Smart garden lights help seedlings", location: "Science room", blurb: "A timer and LED strip gave sprouts a cozy indoor day.", wonder: "Plants need dark nights as well as light." },
  { bands: ["4-6", "7-9", "10-12"], headline: "Keyboard camp teaches typing kindness", location: "Computer lab", blurb: "Coaches practiced helpful chat words before speed drills.", wonder: "Fast fingers still need kind messages." },
  { bands: ["10-12"], headline: "Accessibility win: bigger captions", location: "Tech desk", blurb: "A video app added jumbo captions kids can read from the couch.", wonder: "Good tech invites more people in." },
  { bands: ["7-9", "10-12"], headline: "Drone maps a school garden", location: "School field", blurb: "With adult pilots, students measured beds from above.", wonder: "Maps help plan where the sunniest tomatoes go." },
];

const GAMER: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "Cozy puzzle game gets new levels", location: "Game desk", blurb: "A gentle matching game added gardens and friendly bugs.", wonder: "Calm games can still be brain workouts." },
  { bands: ["7-9", "10-12"], headline: "Esports club practices fair play", location: "Lincoln Middle School", blurb: "A team wrote a sportsmanship checklist before matches.", wonder: "GG means good game — win or lose." },
  { bands: ["4-6"], headline: "Board-game night at the library", location: "Central Library", blurb: "Families tried cooperative games where everyone shares a win.", wonder: "Co-op games train teamwork without keeping score mean." },
  { bands: ["7-9", "10-12"], headline: "Indie makers release a free demo", location: "Online", blurb: "Two teen siblings shipped a short adventure about fixing bridges.", wonder: "Demos let you try before you buy." },
  { bands: ["4-6", "7-9"], headline: "Controller design for smaller hands", location: "Game desk", blurb: "A company showed a lighter pad with softer buttons.", wonder: "Comfort helps you play longer — and kinder." },
  { bands: ["10-12"], headline: "Speedrunners raise charity coins", location: "Online", blurb: "Players raced old classics to fund a kids’ hospital wing.", wonder: "Skills can turn into help for strangers." },
  { bands: ["7-9"], headline: "Minecraft build contest: tiny towns", location: "Computer lab", blurb: "Students built libraries, parks, and solar farms in creative mode.", wonder: "Imagination is a renewable resource." },
  { bands: ["4-6", "7-9"], headline: "New sticker album for trading cards", location: "Card shop", blurb: "A shop hosted a swap table so duplicates find new homes.", wonder: "Trading teaches math and manners." },
  { bands: ["10-12"], headline: "Modding workshop teaches safety", location: "Makerspace", blurb: "Mentors showed how to add skins without breaking save files.", wonder: "Backups are a gamer’s seatbelt." },
  { bands: ["7-9", "10-12"], headline: "Accessible difficulty modes praised", location: "Game desk", blurb: "A studio added helper modes so more kids can finish stories.", wonder: "Challenge should be a choice, not a wall." },
];

const BANKS: Record<NewsModuleId, NewsEntry[]> = {
  news_world: WORLD,
  news_national: NATIONAL,
  news_city: CITY,
  news_tech: TECH,
  news_gamer: GAMER,
};

export function isNewsModule(id: ModuleId): id is NewsModuleId {
  return id in BANKS;
}

function toItem(n: NewsEntry): NewsItem {
  return { headline: n.headline, location: n.location, blurb: n.blurb, wonder: n.wonder };
}

export function pickNews(moduleId: NewsModuleId, band: AgeBand, rng: () => number): NewsItem {
  const bank = BANKS[moduleId];
  const pool = bank.filter((n) => n.bands.includes(band));
  return toItem(pick(rng, pool.length ? pool : bank));
}

/** A short column of distinct age-appropriate stories. */
export function pickNewsList(
  moduleId: NewsModuleId,
  band: AgeBand,
  rng: () => number,
  count: number,
): NewsItem[] {
  const bank = BANKS[moduleId];
  const pool = bank.filter((n) => n.bands.includes(band));
  const src = pool.length >= count ? pool : bank;
  return shuffle(rng, src)
    .slice(0, Math.min(count, src.length))
    .map(toItem);
}
