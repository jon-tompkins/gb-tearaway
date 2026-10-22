import type { AgeBand } from "../../types";

/**
 * Real, well-documented world records about animals, plants, Earth, weather,
 * oceans and space. Shown as a "Record Breaker" card on the morning page.
 * Individual-animal records follow Guinness World Records; weather extremes
 * follow the WMO archive. Volatile or disputed records are left out on purpose.
 */
export const RECORDS_NATURE: { bands: AgeBand[]; category: string; record: string; extra: string }[] = [
  // ── Animals: speed ─────────────────────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The cheetah is the fastest land animal, reaching about 65 miles per hour (105 km/h).", extra: "That’s as fast as a car on the highway." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The peregrine falcon is the fastest animal, diving at more than 200 miles per hour (320 km/h).", extra: "It tucks in its wings and drops through the sky like a dart." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The pronghorn is the fastest land animal in North America, running up to about 55 miles per hour (88 km/h).", extra: "Unlike a cheetah, it can keep up a fast pace for miles." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The three-toed sloth is the slowest mammal, crawling only about 6 feet (2 meters) a minute on the ground.", extra: "Crossing a soccer field could take it most of an hour." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The dwarf seahorse is the slowest-moving fish, traveling only about 5 feet (1.5 meters) in an hour.", extra: "It flutters a tiny back fin that beats about 70 times a second." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The gentoo penguin is the fastest-swimming bird, zooming up to about 22 miles per hour (36 km/h).", extra: "That’s faster than most people can pedal a bike." },

  // ── Animals: biggest ───────────────────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The blue whale is the largest animal ever known, growing up to about 98 feet (30 meters) long.", extra: "That’s longer than two school buses parked end to end." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The blue whale has the heaviest heart of any animal, weighing about 400 pounds (180 kilograms).", extra: "That’s about as heavy as a big motorcycle." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "A newborn blue whale is the biggest baby animal, weighing about 3 tons (2.7 metric tons) at birth.", extra: "It weighs as much as a pickup truck on its very first day." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The African elephant is the largest land animal, weighing up to about 6 tons (5.4 metric tons).", extra: "That’s about as heavy as four cars put together." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The giraffe is the tallest animal, growing up to about 19 feet (5.8 meters) tall.", extra: "A giraffe could peek into a second-floor window." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The ostrich is the largest living bird, standing up to about 9 feet (2.7 meters) tall.", extra: "That’s taller than the tallest basketball players." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The ostrich lays the biggest egg of any living bird, about 6 inches (15 centimeters) long.", extra: "One ostrich egg weighs about as much as two dozen chicken eggs." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The wandering albatross has the longest wingspan of any living bird, up to about 11 feet (3.4 meters).", extra: "That’s almost twice as wide as a grown-up is tall." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The saltwater crocodile is the largest living reptile, with big males reaching about 20 feet (6 meters) long.", extra: "That’s longer than a canoe." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The Komodo dragon is the largest living lizard, growing up to about 10 feet (3 meters) long.", extra: "It lives on a few islands in Indonesia." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The capybara is the largest rodent, weighing up to about 150 pounds (68 kilograms).", extra: "It’s a giant cousin of the guinea pig." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The Goliath frog is the largest frog, with a body up to about 13 inches (32 centimeters) long.", extra: "It can weigh about 7 pounds (3 kilograms), as much as a house cat." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The polar bear is the largest land meat-eater, with big males weighing over 1,000 pounds (450 kilograms).", extra: "Its huge paws work like snowshoes on the ice." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The Siberian tiger is the largest wild cat, with big males weighing about 600 pounds (270 kilograms).", extra: "That’s as heavy as three grown-up people." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The moose is the largest deer, and a male’s antlers can stretch about 6 feet (1.8 meters) across.", extra: "Moose grow a brand-new set of antlers every year." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The emperor penguin is the largest penguin, standing up to about 4 feet (1.2 meters) tall.", extra: "That’s about as tall as a first-grader." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The Queen Alexandra’s birdwing is the largest butterfly, with wings up to about 11 inches (28 centimeters) across.", extra: "That’s about as wide as a dinner plate." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The African elephant has the biggest ears of any animal, each about 6 feet (1.8 meters) long.", extra: "Flapping them helps the elephant cool down on hot days." },

  // ── Animals: smallest ──────────────────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The bee hummingbird is the smallest bird, only about 2 inches (5 centimeters) long.", extra: "It weighs less than a penny." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "Hummingbirds lay the smallest bird eggs, about the size of a jelly bean.", extra: "Their tiny nests can be as small as a walnut shell." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The little blue penguin is the smallest penguin, standing only about 13 inches (33 centimeters) tall.", extra: "It’s a little shorter than a bowling pin." },

  // ── Animals: long lives ────────────────────────────────────────
  { bands: ["7-9", "10-12"], category: "Animals", record: "The bowhead whale is the longest-living mammal, and some have lived more than 200 years.", extra: "One alive today might have been born before the first airplane." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The Greenland shark is the longest-living animal with a backbone, living at least 270 years.", extra: "It swims very slowly through icy Arctic water." },
  { bands: ["10-12"], category: "Oceans", record: "The oldest individual animal ever measured was a clam named Ming, about 507 years old.", extra: "It started growing in the 1490s, around when Columbus sailed." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "Jonathan, a giant tortoise on the island of St Helena, is the oldest known living land animal.", extra: "He hatched around 1832, before anyone had invented the light bulb." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "Wisdom, a Laysan albatross on Midway Atoll, is the oldest known wild bird, at least 74 years old.", extra: "Scientists first put a band on her leg in 1956." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "Creme Puff of Texas was the oldest cat ever recorded, living 38 years.", extra: "Most pet cats live about 12 to 18 years." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "Old Billy was the oldest horse ever recorded, living to 62 years old in England.", extra: "He pulled barges along canals for much of his long life." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "Cookie, a pink cockatoo at a Chicago zoo, was the oldest parrot ever recorded, living to 83.", extra: "He lived at Brookfield Zoo for almost his whole life." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "Tish was the oldest goldfish ever recorded, living to 43 years old in England.", extra: "He was won as a prize at a fair in 1956." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "Flopsy was the oldest rabbit ever recorded, living almost 19 years in Australia.", extra: "Most pet rabbits live about 8 to 12 years." },

  // ── Animals: famous record-holders ─────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "Zeus, a Great Dane from Michigan, was the tallest dog ever, standing 44 inches (1.1 meters) at the shoulder.", extra: "Standing on his back legs, he was taller than most grown-ups." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "Sampson, a Shire horse born in England in 1846, is the tallest horse ever recorded, about 7 feet (2.2 meters).", extra: "That was measured at his shoulders, not even counting his head." },

  // ── Animals: loud, deep, high, far ─────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Oceans", record: "The sperm whale is the loudest animal, making clicks that can travel for miles underwater.", extra: "It uses the echoes of its clicks to find squid in the dark deep sea." },
  { bands: ["4-6", "7-9", "10-12"], category: "Animals", record: "The howler monkey is the loudest land animal, with calls heard about 3 miles (5 kilometers) away.", extra: "Howlers call out at dawn to tell other groups where they are." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "Cuvier’s beaked whale is the deepest-diving mammal, reaching almost 10,000 feet (3,000 meters) down.", extra: "One dive lasted more than two hours on a single breath." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The deepest fish ever filmed was a snailfish, about 27,000 feet (8,300 meters) under the sea.", extra: "That’s nearly as deep as Mount Everest is tall." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The Arctic tern has the longest migration of any animal, flying about 44,000 miles (71,000 kilometers) a year.", extra: "It sees two summers every year, one near each pole." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The froghopper is the best jumper for its size, leaping about 28 inches (70 centimeters) high.", extra: "That’s more than 100 times its own body length." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "A millipede found in Australia in 2021 has the most legs of any animal: 1,306.", extra: "It lives deep underground and has no eyes." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "Elephants have the longest pregnancy of any mammal, about 22 months.", extra: "That’s almost two whole years of waiting for a baby." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The largest beaver dam ever found is about 2,790 feet (850 meters) long, in Canada.", extra: "It’s so big it can be spotted in pictures taken from space." },
  { bands: ["7-9", "10-12"], category: "Animals", record: "The biggest bird’s nest on record was built by bald eagles in Florida, about 9 feet (2.9 meters) wide.", extra: "Scientists think it weighed about 2 tons, as much as a car." },

  // ── Oceans ─────────────────────────────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Oceans", record: "The whale shark is the largest fish, growing more than 40 feet (12 meters) long.", extra: "It’s gentle and eats tiny food called plankton." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The colossal squid has the largest eyes of any animal, about 11 inches (27 centimeters) across.", extra: "Each eye is bigger than a soccer ball." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The lion’s mane jellyfish is the largest jellyfish, with tentacles that can trail over 100 feet (30 meters).", extra: "That’s longer than a blue whale." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The Japanese spider crab has the longest legs of any crab, spanning about 12 feet (3.7 meters).", extra: "With its legs spread out, it’s about as long as a small car." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The leatherback is the largest sea turtle, and big ones can weigh more than 1,500 pounds (680 kilograms).", extra: "It swims thousands of miles across oceans to find jellyfish to eat." },
  { bands: ["4-6", "7-9", "10-12"], category: "Oceans", record: "The giant manta ray is the largest ray, with fins spreading up to about 23 feet (7 meters).", extra: "It glides through the water like a giant underwater bird." },
  { bands: ["4-6", "7-9", "10-12"], category: "Oceans", record: "The giant clam is the largest clam, growing up to about 4 feet (1.2 meters) across.", extra: "It can weigh more than 440 pounds (200 kilograms)." },
  { bands: ["4-6", "7-9", "10-12"], category: "Oceans", record: "The Pacific is the largest ocean, covering about one third of Earth.", extra: "All the land on Earth could fit inside it, with room to spare." },
  { bands: ["4-6", "7-9", "10-12"], category: "Oceans", record: "The Arctic is the smallest and shallowest ocean on Earth.", extra: "Much of it is covered by floating sea ice." },
  { bands: ["4-6", "7-9", "10-12"], category: "Oceans", record: "The Challenger Deep is the deepest place in the ocean, nearly 36,000 feet (11,000 meters) down.", extra: "If Mount Everest sat at the bottom, its top would still be underwater." },
  { bands: ["4-6", "7-9", "10-12"], category: "Oceans", record: "The Great Barrier Reef in Australia is the largest coral reef, stretching about 1,400 miles (2,300 kilometers).", extra: "It’s the largest thing on Earth built by living creatures." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The longest mountain range on Earth runs under the sea, stretching about 40,000 miles (65,000 kilometers).", extra: "It wraps around the planet like the seam on a baseball." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The Bay of Fundy in Canada has the highest tides, with water rising about 53 feet (16 meters).", extra: "That’s as tall as a four-story building." },
  { bands: ["7-9", "10-12"], category: "Oceans", record: "The largest known plant is a seagrass meadow in Australia, covering about 70 square miles (180 square kilometers).", extra: "Scientists found it all grew from just one seed." },

  // ── Plants ─────────────────────────────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Plants", record: "A coast redwood named Hyperion is the tallest known tree, about 380 feet (116 meters) tall.", extra: "That’s taller than the Statue of Liberty." },
  { bands: ["7-9", "10-12"], category: "Plants", record: "A giant sequoia named General Sherman is the largest tree by volume on Earth.", extra: "It would take more than 20 kids holding hands to circle its trunk." },
  { bands: ["7-9", "10-12"], category: "Plants", record: "A bristlecone pine called Methuselah, in California, is one of the oldest trees, about 4,800 years old.", extra: "It was already old when the Egyptian pyramids were built." },
  { bands: ["4-6", "7-9", "10-12"], category: "Plants", record: "Rafflesia arnoldii has the biggest single flower, up to about 3 feet (1 meter) across.", extra: "One flower can weigh as much as a big bag of dog food." },
  { bands: ["7-9", "10-12"], category: "Plants", record: "The titan arum has the tallest flower spike in the world, reaching about 10 feet (3 meters).", extra: "It blooms only once every several years, and only for a few days." },
  { bands: ["7-9", "10-12"], category: "Plants", record: "The coco de mer palm has the biggest seed of any plant, weighing up to about 40 pounds (18 kilograms).", extra: "That’s as heavy as a four-year-old child." },
  { bands: ["4-6", "7-9", "10-12"], category: "Plants", record: "Some kinds of bamboo are the fastest-growing plants, growing up to about 35 inches (91 centimeters) in one day.", extra: "You could almost watch it get taller." },
  { bands: ["4-6", "7-9", "10-12"], category: "Plants", record: "The giant water lily has the biggest floating leaves, up to about 10 feet (3 meters) wide.", extra: "A big leaf can hold up a small child without sinking." },
  { bands: ["4-6", "7-9", "10-12"], category: "Plants", record: "The jackfruit is the largest fruit that grows on a tree, sometimes weighing more than 80 pounds (36 kilograms).", extra: "That’s about as heavy as a big dog." },
  { bands: ["7-9", "10-12"], category: "Plants", record: "The cardón of Mexico is the tallest cactus, growing up to about 63 feet (19 meters).", extra: "That’s taller than a six-story building." },
  { bands: ["4-6", "7-9", "10-12"], category: "Plants", record: "The Amazon is the largest rainforest, covering about 2 million square miles (5.5 million km²).", extra: "It’s home to about one in ten kinds of animals and plants on Earth." },

  // ── Earth ──────────────────────────────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Earth", record: "Mount Everest is the highest mountain above sea level, about 29,032 feet (8,849 meters) tall.", extra: "Its top is almost as high as planes fly." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "Mauna Kea in Hawaii is the tallest mountain from base to top, about 33,500 feet (10,200 meters).", extra: "Most of it is hidden under the Pacific Ocean." },
  { bands: ["4-6", "7-9", "10-12"], category: "Earth", record: "Angel Falls in Venezuela is the highest waterfall, dropping about 3,212 feet (979 meters).", extra: "That’s more than twice as tall as the Empire State Building." },
  { bands: ["4-6", "7-9", "10-12"], category: "Earth", record: "Greenland is the largest island in the world.", extra: "Most of it is covered by a thick sheet of ice." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "The Caspian Sea is the largest lake in the world, even though it is called a sea.", extra: "It touches five different countries." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "Lake Baikal in Russia is the deepest lake, more than 5,300 feet (1,600 meters) deep.", extra: "It holds about one fifth of all the fresh lake and river water on Earth." },
  { bands: ["4-6", "7-9", "10-12"], category: "Earth", record: "The Amazon River carries more water than any other river on Earth.", extra: "It pours more water into the ocean than the next seven biggest rivers combined." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "The Sahara is the largest hot desert, about 3.6 million square miles (9.2 million km²).", extra: "It’s almost as big as the whole United States." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "Antarctica is the largest desert on Earth, because so little snow or rain falls there.", extra: "A desert doesn’t have to be hot, just very dry." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "The Antarctic ice sheet is the thickest ice on Earth, almost 3 miles (4.8 kilometers) thick in places.", extra: "That’s about ten Empire State Buildings stacked up." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "The shore of the Dead Sea is the lowest land on Earth, more than 1,400 feet (430 meters) below sea level.", extra: "Its water is so salty that people float easily." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "Mammoth Cave in Kentucky is the longest known cave, with more than 420 miles (680 kilometers) mapped.", extra: "Explorers keep finding new tunnels every year." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "Steamboat Geyser in Yellowstone is the tallest active geyser, shooting water up to about 300 feet (90 meters).", extra: "That’s taller than a 25-story building." },
  { bands: ["7-9", "10-12"], category: "Earth", record: "The largest iceberg ever measured, B-15, broke off Antarctica in 2000 and covered about 4,200 square miles.", extra: "It was bigger than the island of Jamaica." },

  // ── Weather ────────────────────────────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Weather", record: "The hottest air temperature ever recorded was 134°F (56.7°C), in Death Valley, California, in 1913.", extra: "That’s hot enough to make a sidewalk too hot to touch." },
  { bands: ["4-6", "7-9", "10-12"], category: "Weather", record: "The coldest temperature ever measured on the ground was about −128.6°F (−89.2°C), in Antarctica in 1983.", extra: "That’s much colder than the inside of a freezer." },
  { bands: ["7-9", "10-12"], category: "Weather", record: "The heaviest hailstone on record fell in Bangladesh in 1986, weighing about 2.25 pounds (1 kilogram).", extra: "That’s about as heavy as a pineapple." },
  { bands: ["7-9", "10-12"], category: "Weather", record: "The biggest hailstone in the United States fell in Vivian, South Dakota, in 2010, measuring 8 inches (20 centimeters) across.", extra: "That’s about the size of a volleyball." },
  { bands: ["7-9", "10-12"], category: "Weather", record: "The strongest wind gust ever measured outside a tornado was 253 miles per hour (408 km/h), in Australia in 1996.", extra: "It happened during a cyclone on Barrow Island." },
  { bands: ["10-12"], category: "Weather", record: "Hurricane Patricia in 2015 had the fastest steady winds ever measured in a hurricane, about 215 miles per hour (345 km/h).", extra: "Planes flew right into the storm to measure it." },
  { bands: ["10-12"], category: "Weather", record: "Typhoon Tip in 1979 was the largest tropical storm ever measured, about 1,380 miles (2,220 kilometers) across.", extra: "It could have covered almost half of the United States." },
  { bands: ["7-9", "10-12"], category: "Weather", record: "The longest lightning flash on record stretched 515 miles (829 kilometers), from Texas to near Kansas City, in 2017.", extra: "Weather satellites in space spotted the whole flash." },
  { bands: ["7-9", "10-12"], category: "Weather", record: "The Atacama Desert in Chile is the driest non-polar place on Earth.", extra: "Some weather stations there have almost never recorded rain." },
  { bands: ["10-12"], category: "Weather", record: "Mount Baker in Washington State got the most snow ever measured in one season: 1,140 inches (29 meters).", extra: "That’s as deep as a nine-story building is tall." },
  { bands: ["10-12"], category: "Weather", record: "The most rain in one day fell on Réunion Island in 1966: about 72 inches (1.8 meters).", extra: "That’s more rain than many cities get in a whole year." },
  { bands: ["10-12"], category: "Weather", record: "The fastest temperature jump on record happened in Spearfish, South Dakota, in 1943: 49°F in two minutes.", extra: "It went from below freezing to jacket weather almost instantly." },

  // ── Space ──────────────────────────────────────────────────────
  { bands: ["4-6", "7-9", "10-12"], category: "Space", record: "The Sun is the biggest thing in our solar system, about 109 times wider than Earth.", extra: "More than a million Earths could fit inside it." },
  { bands: ["4-6", "7-9", "10-12"], category: "Space", record: "Jupiter is the largest planet in our solar system.", extra: "More than 1,300 Earths could fit inside it." },
  { bands: ["4-6", "7-9", "10-12"], category: "Space", record: "Mercury is the smallest planet in our solar system.", extra: "It’s only a little bigger than our Moon." },
  { bands: ["4-6", "7-9", "10-12"], category: "Space", record: "Venus is the hottest planet, about 870°F (465°C) on the surface.", extra: "That’s hot enough to melt lead." },
  { bands: ["4-6", "7-9", "10-12"], category: "Space", record: "Saturn has more known moons than any other planet, nearly 300.", extra: "Scientists keep discovering new tiny ones." },
  { bands: ["4-6", "7-9", "10-12"], category: "Space", record: "Saturn has the biggest, brightest rings of any planet.", extra: "The rings are made of chunks of ice and rock." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Ganymede, a moon of Jupiter, is the largest moon in our solar system.", extra: "It’s even bigger than the planet Mercury." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Io, a moon of Jupiter, is the most volcanic place in our solar system, with hundreds of active volcanoes.", extra: "Some of its volcanoes shoot material high above the surface." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Olympus Mons on Mars is the tallest volcano in our solar system, about 16 miles (25 kilometers) high.", extra: "That’s nearly three times as tall as Mount Everest." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Jupiter’s Great Red Spot is the biggest storm in our solar system, wider than Earth.", extra: "People have watched it swirl for more than 150 years." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Neptune has the fastest winds of any planet, about 1,200 miles per hour (2,000 km/h).", extra: "That’s faster than the speed of sound on Earth." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Venus has the longest day of any planet, lasting 243 Earth days.", extra: "A day on Venus is longer than its whole year." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Neptune has the longest year of any planet, taking about 165 Earth years to circle the Sun.", extra: "Since it was discovered in 1846, it has gone around only once." },
  { bands: ["4-6", "7-9", "10-12"], category: "Space", record: "Sirius is the brightest star in the night sky.", extra: "Some people call it the Dog Star." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Proxima Centauri is the closest star to the Sun, about 4.2 light-years away.", extra: "Its light takes more than four years to reach us." },
  { bands: ["4-6", "7-9", "10-12"], category: "Space", record: "Venus is the brightest planet in our sky.", extra: "People often call it the Morning Star or Evening Star." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Pluto is the largest known dwarf planet, about 1,477 miles (2,377 kilometers) wide.", extra: "It has a big heart-shaped patch of ice." },
  { bands: ["10-12"], category: "Space", record: "The Boomerang Nebula is the coldest known natural place in the universe, about −458°F (−272°C).", extra: "That’s colder than empty space itself." },
  { bands: ["10-12"], category: "Space", record: "The Andromeda Galaxy is the farthest thing most people can see without a telescope, about 2.5 million light-years away.", extra: "The light you see left it long before modern humans existed." },
  { bands: ["7-9", "10-12"], category: "Space", record: "Voyager 1 is the farthest human-made object, more than 15 billion miles (24 billion kilometers) from Earth.", extra: "It was launched in 1977 and is still sending messages home." },
];
