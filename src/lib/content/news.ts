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
  /** The story — a few sentences of real context, kid-friendly. */
  blurb: string;
  /** A closing "did you know" fact. */
  wonder: string;
}

interface NewsEntry extends NewsItem {
  bands: AgeBand[];
}

const WORLD: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "Baby pandas learn to climb", location: "Chengdu, China", blurb: "At a panda reserve in Chengdu, keepers shared new video of this year’s cubs practicing in the trees. The fuzzy babies kept tumbling off the low branches into soft piles of hay, then scrambling right back up to try again. Keepers weigh each cub every morning to be sure it is growing strong before it moves to a bigger outdoor yard.", wonder: "A newborn panda is about the size of a stick of butter — smaller than your hand." },
  { bands: ["4-6", "7-9"], headline: "Whale songs travel the ocean", location: "Pacific Ocean", blurb: "Scientists listening with underwater microphones say humpback whale songs are crossing the Pacific far wider than anyone expected. A tune first heard near Hawaii was picked up days later by a boat hundreds of miles away. Researchers think whales use the long songs to find one another across the wide, dark sea.", wonder: "One humpback song can last more than 20 minutes — like a few pop songs in a row." },
  { bands: ["7-9", "10-12"], headline: "Hidden coral reef discovered", location: "Queensland, Australia", blurb: "Divers off the coast of Australia found a towering coral reef that was missing from every old map. It stands taller than a 40-story building and swarms with fish, turtles, and swaying sea fans. The team filmed it using a camera robot so they never had to touch the delicate coral, which grows only a little each year.", wonder: "Coral looks like a plant but is really a colony of tiny animals living together." },
  { bands: ["7-9", "10-12"], headline: "Students plant a new forest", location: "Nairobi, Kenya", blurb: "Students near Nairobi spent the week planting hundreds of young native trees along a creek that had dried up. Each class adopts a row of seedlings and takes turns watering them before lessons begin. Teachers say the roots will hold the soil in place and, in a few years, bring back shade, birds, and even small streams.", wonder: "Some of the trees the students planted can live for hundreds of years." },
  { bands: ["4-6"], headline: "Little houses for penguins", location: "Cape Town, South Africa", blurb: "A seaside town in South Africa built rows of small nest boxes to help a shrinking penguin colony raise more chicks. The shady boxes keep the eggs cool on hot days and safe from hungry gulls. Volunteers peek inside gently and keep a chart of how many chicks hatch.", wonder: "Penguin parents take turns keeping the egg warm so the other can swim off to eat." },
  { bands: ["10-12"], headline: "Telescope sees a planet nursery", location: "Atacama Desert, Chile", blurb: "High in Chile’s bone-dry Atacama Desert, a giant telescope captured a sharp photo of rings of dust and gas swirling around a young star. Scientists believe brand-new planets are slowly clumping together inside those rings right now. The clear desert sky, far from any city lights, lets the telescope spot faint objects trillions of miles away.", wonder: "Our own Sun and planets formed from a spinning dust cloud like that long ago." },
  { bands: ["4-6", "7-9"], headline: "Giant pumpkin wins the fair", location: "Ludwigsburg, Germany", blurb: "Farmers wheeled their biggest pumpkins onto a huge scale at a harvest fair in Germany, cheering as each orange giant was weighed. The winner was heavier than a grown polar bear and took four people to lift. Growers spend all summer feeding the vines and shading the fruit so it swells to record size.", wonder: "The biggest pumpkins can gain more than 30 pounds in a single day." },
  { bands: ["7-9", "10-12"], headline: "River otters return to the city", location: "London, England", blurb: "Otters have been spotted swimming in a stretch of London’s River Thames where they had not lived for decades. Cleaner water and new plants along the banks finally gave the shy animals a reason to come back. Wildlife groups set up night cameras and were thrilled to film a mother otter leading her pups to the water.", wonder: "Otters only settle where fish are plentiful, so they are a sign of a healthy river." },
  { bands: ["4-6", "7-9", "10-12"], headline: "Fireflies light up the night", location: "Nagoya, Japan", blurb: "Families in Nagoya gathered at dusk to watch thousands of fireflies blink together over a quiet river. For a few weeks each year the insects flash in slow waves, turning the dark field into a glowing light show. Volunteers keep the area dark and litter-free so the fireflies keep coming back.", wonder: "Each kind of firefly has its own blinking pattern, like a secret code." },
  { bands: ["10-12"], headline: "Ancient seed sprouts to life", location: "Tel Aviv, Israel", blurb: "Scientists in Israel carefully planted a seed that had rested for centuries and were amazed when a green shoot pushed up from the soil. The seed had been found tucked inside an ancient storage jar by archaeologists. Researchers are now growing the plant to learn what fruits and trees were like long, long ago.", wonder: "Some seeds can stay alive but fast asleep for hundreds or even thousands of years." },
];

const NATIONAL: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "Beloved park trail reopens", location: "Everglades, Florida", blurb: "After months of repairs, rangers reopened a favorite boardwalk trail through the Everglades so families can once again stroll right over the marsh. Fresh planks and railings replaced ones the storms had worn away. Visitors on opening day spotted herons, turtles, and a sleepy alligator sunning nearby.", wonder: "Boardwalks let people explore wetlands without stepping on the plants and nests below." },
  { bands: ["7-9", "10-12"], headline: "Young inventors win science fair", location: "Columbus, Ohio", blurb: "Students packed a gym in Columbus to show off projects at the state science fair. Winning ideas included a machine that sorts recycling by weight and a planter that waters itself using old bottles. Judges said the best projects all started as a simple question the student really wanted to answer.", wonder: "Many famous inventions began as messy cardboard-and-tape prototypes." },
  { bands: ["4-6"], headline: "Library books arrive by bike", location: "Portland, Oregon", blurb: "Librarians in Portland loaded picture books into baskets on bicycles and pedaled them straight to neighborhood parks. Kids who live far from the library can now borrow stories on sunny afternoons. The book bikes even carry library cards so brand-new readers can sign up right there.", wonder: "A library can be almost anywhere — even a basket on two wheels." },
  { bands: ["7-9", "10-12"], headline: "Kids count backyard birds", location: "Austin, Texas", blurb: "A class in Austin spent the morning counting the birds at their feeders and windows for a nationwide bird-watch day. Their tally joins thousands of others that help scientists track where birds live and travel. The students were amazed to log a dozen different species from a single classroom window.", wonder: "Backyard bird counts help researchers notice which species might need help." },
  { bands: ["4-6", "7-9"], headline: "Neighbors share a big harvest", location: "Detroit, Michigan", blurb: "Neighbors in Detroit gathered at their community garden to pick ripe tomatoes, peppers, and herbs, then swapped recipes at a long picnic table. The garden turned an empty lot into a green space where families grow food side by side. Extra vegetables were boxed up and carried to a nearby food pantry.", wonder: "One small packet of seeds can grow enough vegetables to feed a whole block." },
  { bands: ["10-12"], headline: "Teens rebuild a playground", location: "Denver, Colorado", blurb: "Teenagers in Denver helped design and rebuild a neighborhood playground with ramps, quiet corners, and swings everyone can use. They asked the younger kids what they wanted before drawing the plans. The new space was built so children who use wheelchairs can play right alongside their friends.", wonder: "Good designers always ask who might have felt left out before." },
  { bands: ["4-6", "7-9"], headline: "A wall of kindness appears", location: "Nashville, Tennessee", blurb: "Students and local artists in Nashville painted a bright mural showing neighbors helping neighbors. The wall had been plain and gray for years. Now it bursts with a giant smiling sun, a leafy garden, and dozens of helping hands.", wonder: "A mural can turn a blank wall into a story the whole street shares." },
  { bands: ["7-9", "10-12"], headline: "Families clean up the creek", location: "Pittsburgh, Pennsylvania", blurb: "Families in Pittsburgh pulled on gloves and spent Saturday clearing litter from a creek, writing down everything they pulled out. Plastic bottles and old bags topped the list by a mile. The crew weighed their bags and challenged another neighborhood to beat them next month.", wonder: "Trash dropped on a street often washes straight into a creek when it rains." },
  { bands: ["4-6"], headline: "Storytime under the stars", location: "Tucson, Arizona", blurb: "A park in Tucson hosted bedtime stories under the open sky, handing out flashlights and warm cups of cocoa. Kids in pajamas listened as a librarian read picture books by lantern light. Between stories, a guide pointed out the bright constellations twinkling overhead.", wonder: "Reading a story outside at night can make every page feel a little more magical." },
  { bands: ["10-12"], headline: "Students launch a weather station", location: "Des Moines, Iowa", blurb: "A middle school in Des Moines set up its own weather station and now posts rain and wind readings on a simple website. Students check the gauges each morning and update the numbers. Local gardeners and soccer coaches have already started using the data to plan their days.", wonder: "Weather watchers have helped farmers decide when to plant for thousands of years." },
];

const CITY: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "New slide opens at the park", location: "Riverside Park", blurb: "City crews finished installing a tall, twisty new slide at Riverside Park just in time for the weekend. The old slide had cracked and been roped off for months. On opening day a long, giggling line stretched down the steps as kids took turns whooshing to the bottom.", wonder: "The first-ride rule at any new slide: wait your turn and cheer for the kid ahead of you." },
  { bands: ["4-6"], headline: "A reading puppy visits", location: "Central Library", blurb: "The Central Library welcomed a gentle reading dog named Biscuit, who sat quietly while kids read stories out loud to him. Practicing with a calm listener helps new readers feel brave. Biscuit’s only review of every book was a happy thump of his tail.", wonder: "Dogs make patient listeners because they never mind if you sound out a tricky word." },
  { bands: ["7-9", "10-12"], headline: "Farmers’ market gets a new spot", location: "Fountain Square", blurb: "The farmers’ market moved to a sunny corner near the fountain, with tents full of peaches, fresh bread, and jars of honey. Growers hand out samples and answer questions about how the food is grown. Shoppers can now walk there easily from the bus stop and the library.", wonder: "Ask a farmer sometime how many weeks a single peach took to ripen." },
  { bands: ["4-6", "7-9"], headline: "Crosswalks get a splash of art", location: "Main Street", blurb: "Volunteers spent the weekend painting colorful patterns on the Main Street crosswalks so drivers slow down and notice people walking. The bright designs were dreamed up by kids at a nearby school. City workers say drivers really do brake sooner near the cheerful stripes.", wonder: "A splash of art on the road can double as a safety tool." },
  { bands: ["7-9"], headline: "A walk through town history", location: "Old Town", blurb: "A guide led families on a walk through Old Town, pointing out the century-old firehouse, the very first bakery, and a mural hidden down an alley. Kids collected a clue at each stop to solve a neighborhood mystery. Many were surprised how many stories their own streets could tell.", wonder: "Almost every old building on your block has a chapter you can still see." },
  { bands: ["10-12"], headline: "Kids vote on a park project", location: "City Hall", blurb: "The city’s youth council met at City Hall and voted on how to spend money set aside for a park. Shade trees and a giant outdoor chess table won the most votes. Council members practiced making speeches and listening carefully to ideas they disagreed with.", wonder: "Voting is how a whole group decides together instead of just the loudest person." },
  { bands: ["4-6", "7-9"], headline: "Sidewalks bloom with chalk", location: "Elm Street", blurb: "Neighbors covered the sidewalks of Elm Street with chalk dinosaurs, rainbows, and thank-you notes at the yearly chalk festival. Artists of every age claimed a square and got to work. Everyone knows the art washes away with the next rain, and that is part of the fun.", wonder: "Rain is the world’s biggest eraser — so enjoy chalk art while it lasts." },
  { bands: ["7-9", "10-12"], headline: "Bike safety day rolls in", location: "Lincoln School", blurb: "Helpers turned the Lincoln School parking lot into a practice course where kids learned hand signals, helmet checks, and how to stop safely. Riders wove between cones and rang their bells at pretend crosswalks. Everyone left with a sticker and a little more confidence.", wonder: "A bike bell is really just a polite way to say “excuse me.”" },
  { bands: ["4-6"], headline: "Ducklings cross the path", location: "Millpond Path", blurb: "Walkers on the Millpond Path paused this week while a mother duck marched her fuzzy ducklings from the grass down to the water. People stopped and grinned as the tiny line waddled across. A friendly jogger even held up a hand to hold the way.", wonder: "Ducklings can walk, swim, and find their own food within a day of hatching." },
  { bands: ["10-12"], headline: "Repair café fixes it for free", location: "Community Center", blurb: "At the Community Center’s repair café, volunteers fixed broken toys, lamps, and bikes for free instead of letting them be thrown away. Visitors leaned in to learn how to solder, sew, and glue. By afternoon a whole pile of “broken” treasures were working again.", wonder: "Fixing something is a bit like inventing it in reverse." },
];

const TECH: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "Robot draws a map of its room", location: "Tech desk", blurb: "A classroom robot vacuum spent the week exploring and drew the room as a neat little floor plan on a screen. Students watched it bump gently into chairs, remember the spots, and plan a smarter path. They learned the robot “sees” with spinning sensors instead of eyes.", wonder: "Robots sense the world with lasers, bumpers, and cameras — never eyeballs." },
  { bands: ["7-9", "10-12"], headline: "Kids code a weather app", location: "Code lab", blurb: "Students in a coding club built a weather app that shows a sun, cloud, or raindrop that changes with the real forecast. They typed the instructions themselves and hunted down the bugs one at a time. When the icon finally matched the sky outside, the whole room cheered.", wonder: "Code is just a set of instructions — and you can always rewrite it." },
  { bands: ["4-6"], headline: "A book that reads aloud", location: "Central Library", blurb: "A new library tablet reads picture books out loud when kids tap the pictures, helping early readers follow along. Little ones can hear a word, then try saying it themselves. Librarians point out the paper books are still right next door for anyone who likes turning real pages.", wonder: "Hearing a story while reading it helps brand-new words stick in your memory." },
  { bands: ["7-9", "10-12"], headline: "Students build a tiny satellite", location: "Cape Canaveral, Florida", blurb: "A team of students built a satellite about the size of a tissue box and sent it to Florida for a test launch. The little “CubeSat” carries a camera and a thermometer to beam data back to their classroom. Building it took patience, teamwork, and a whole lot of careful soldering.", wonder: "Real space hardware can start on an ordinary classroom workbench." },
  { bands: ["4-6", "7-9"], headline: "3D printer saves game night", location: "Makerspace", blurb: "At the local makerspace, a 3D printer hummed for hours reprinting lost game pieces so families could finish their board games again. Kids designed replacement pawns and dice on a computer first. The makerspace shares its designs online so other families can print the same parts.", wonder: "Sharing a design online lets kids across the world fix the very same toy." },
  { bands: ["10-12"], headline: "Free telescope plans shared online", location: "Online", blurb: "A group of hobbyists posted free, open plans for a gadget that keeps a backyard telescope pointed at a star as the Earth slowly turns. Anyone can download the instructions and build one from cheap parts. Beginners say it made planets and the Moon far easier to find.", wonder: "“Open source” means anyone is allowed to peek inside and improve the design." },
  { bands: ["7-9"], headline: "Indoor lights grow seedlings", location: "Science room", blurb: "In a school science room, a timer and a strip of LED lights gave tiny seedlings a warm, bright day indoors while snow fell outside. Students measured how much the sprouts grew each week. They also learned that plants need dark, quiet nights to rest.", wonder: "Plants use light to make their own food in a process called photosynthesis." },
  { bands: ["4-6", "7-9", "10-12"], headline: "Typing camp practices kindness", location: "Computer lab", blurb: "At a summer keyboard camp, coaches had kids practice friendly, helpful chat messages before starting their speed-typing drills. The idea is that fast fingers should still send kind words. By the end of the week, students typed quicker and cheered each other on.", wonder: "Being quick online means little if the message you send is not kind." },
  { bands: ["10-12"], headline: "App adds giant captions", location: "Tech desk", blurb: "A popular video app added jumbo-sized captions that kids can read from across the room, a big help for viewers who are deaf or hard of hearing. Families can now choose the caption size that works best for them. Designers noticed plenty of other viewers switched them on too.", wonder: "Features built for a few people often end up helping everyone." },
  { bands: ["7-9", "10-12"], headline: "Drone maps the school garden", location: "School field", blurb: "With adult pilots at the controls, students used a camera drone to photograph their school garden from high above. The bird’s-eye pictures showed exactly which beds soaked up the most sun. The class used the map to decide where to plant their sun-loving tomatoes.", wonder: "A view from above can reveal patterns you would never spot from the ground." },
];

const GAMER: NewsEntry[] = [
  { bands: ["4-6", "7-9"], headline: "Cozy puzzle game grows a garden", location: "Game desk", blurb: "A gentle matching game released new levels set in flower gardens full of friendly bugs. There are no timers and no scary enemies — just calm puzzles to solve at your own pace. Players say it is a nice way to unwind while still giving the brain a workout.", wonder: "Slow, calm games can sharpen focus just as much as fast ones." },
  { bands: ["7-9", "10-12"], headline: "Esports team writes fair-play rules", location: "Lincoln Middle School", blurb: "A middle-school esports team wrote its own sportsmanship checklist to follow before every match. The rules include shaking hands, no trash talk, and saying “good game” win or lose. Coaches say the team actually plays better now that everyone feels respected.", wonder: "“GG” is short for “good game” — a way to be a gracious winner or loser." },
  { bands: ["4-6"], headline: "Team-up games at the library", location: "Central Library", blurb: "The library’s game night featured cooperative board games where all the players win or lose together instead of competing. Families teamed up to beat the game itself, swapping tips and cheering each small success. Newcomers found it an easy, friendly way to make friends.", wonder: "Co-op games are great practice for teamwork, since nobody gets left out." },
  { bands: ["7-9", "10-12"], headline: "Teen siblings release a free demo", location: "Online", blurb: "Two teenage siblings released a free demo of a small adventure game about repairing broken bridges so villagers can cross a river. Players can try the opening before deciding whether to buy the full story. The siblings drew every character and wrote the music themselves.", wonder: "A demo lets you test a game for free before spending any money." },
  { bands: ["4-6", "7-9"], headline: "New controller fits small hands", location: "Game desk", blurb: "A game company showed off a lighter controller with softer, easier-to-press buttons made for smaller hands. Comfortable controllers help younger players enjoy games longer without sore thumbs. Testers said the new pad was much easier to hold during long co-op sessions.", wonder: "Comfortable gear helps you play longer — and stay in a kinder mood." },
  { bands: ["10-12"], headline: "Speedrunners raise money for kids", location: "Online", blurb: "Skilled players raced through classic games as fast as they could to raise money for a children’s hospital. Viewers donated as the runners dodged, jumped, and beat old levels in record time. Together they collected enough to help decorate a brand-new hospital wing.", wonder: "A hobby you practice just for fun can turn into real help for strangers." },
  { bands: ["7-9"], headline: "Minecraft contest builds tiny towns", location: "Computer lab", blurb: "In a school computer lab, students held a building contest to design tiny towns complete with libraries, parks, and solar farms. Each builder explained the choices behind their town. Judges gave bonus points for clever, kind ideas like ramps and community gardens.", wonder: "In creative mode, imagination is the one resource you can never run out of." },
  { bands: ["4-6", "7-9"], headline: "Trading table swaps cards", location: "Card shop", blurb: "A local shop set up a swap table so kids could trade their duplicate cards and stickers to finish their albums. Trading sneaks in some quick math as players weigh whether a deal is fair. Everyone left with new cards and, often, a brand-new friend.", wonder: "Trading is quiet practice for math, patience, and good manners." },
  { bands: ["10-12"], headline: "Workshop teaches safe modding", location: "Makerspace", blurb: "Mentors at a makerspace taught kids how to safely add custom skins and levels to their games without breaking their saved progress. Step one was always making a backup copy first. Young modders learned that tinkering is a blast when you protect your work.", wonder: "A backup file is a gamer’s seatbelt — boring until the day it saves you." },
  { bands: ["7-9", "10-12"], headline: "Helper modes win praise", location: "Game desk", blurb: "A game studio earned cheers for adding helper modes that let more players finish a tricky adventure at their own level. The options include slower enemies and gentle hints you can turn on. Fans said the changes let younger siblings and new players enjoy the same story.", wonder: "A good challenge should feel like a choice, not a locked door." },
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

/** A live news item carrying its age bands (from the RSS→Haiku pipeline). */
export type LiveNewsEntry = NewsItem & { bands: AgeBand[] };

/** Build a story column from a provided pool (live daily news), band-filtered. */
export function newsListFromPool(
  pool: LiveNewsEntry[],
  band: AgeBand,
  rng: () => number,
  count: number,
): NewsItem[] {
  const fit = pool.filter((n) => n.bands.includes(band));
  const src = fit.length >= count ? fit : pool;
  return shuffle(rng, src)
    .slice(0, Math.min(count, src.length))
    .map((n) => ({ headline: n.headline, location: n.location, blurb: n.blurb, wonder: n.wonder }));
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
