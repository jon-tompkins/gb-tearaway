import type { AgeBand } from "../../types";
import type { AnimalSpec } from "../../puzzles/animal-art";

export interface AnimalEntry {
  bands: AgeBand[];
  name: string;
  spec: AnimalSpec;
  lives: string;
  size: string;
  fact: string;
}
const ALL: AgeBand[] = ["4-6", "7-9", "10-12"];
const Q = (o: Omit<import("../../puzzles/animal-art").QuadSpec, "plan">): AnimalSpec => ({ plan: "quad", ...o });
const B = (o: Omit<import("../../puzzles/animal-art").BirdSpec, "plan">): AnimalSpec => ({ plan: "bird", ...o });
const Fi = (kind: import("../../puzzles/animal-art").FishSpec["kind"]): AnimalSpec => ({ plan: "fish", kind });
const M = (plan: import("../../puzzles/animal-art").MiscSpec["plan"]): AnimalSpec => ({ plan });

export const ANIMALS: AnimalEntry[] = [
  { bands: ALL, name: "Elephant", spec: { plan: "custom", id: "elephant" }, lives: "African and Asian grasslands and forests", size: "Up to 3.5 m tall; the biggest land animal", fact: "An elephant’s trunk has around 40,000 muscles and can pick up a single peanut." },
  { bands: ALL, name: "Giraffe", spec: { plan: "custom", id: "giraffe" }, lives: "African savannas", size: "Up to 5.5 m tall; the tallest animal", fact: "A giraffe has the same number of neck bones as you: seven. They are just very long." },
  { bands: ALL, name: "Lion", spec: { plan: "custom", id: "lion" }, lives: "African grasslands", size: "About 1.2 m tall at the shoulder", fact: "A lion’s roar can be heard from about 8 km away." },
  { bands: ALL, name: "Tiger", spec: { plan: "custom", id: "tiger" }, lives: "Forests and grasslands of Asia", size: "Up to 3 m long, the largest wild cat", fact: "No two tigers have the same stripes, and the stripes go all the way into the skin." },
  { bands: ALL, name: "Zebra", spec: { plan: "custom", id: "zebra" }, lives: "African grasslands", size: "About 1.3 m tall at the shoulder", fact: "A zebra’s stripe pattern is unique, like your fingerprint." },
  { bands: ALL, name: "Hippopotamus", spec: { plan: "custom", id: "hippo" }, lives: "Rivers and lakes of Africa", size: "Up to 1.5 m tall; weighs as much as a small car", fact: "A hippo’s sweat is a reddish oil that works like sunscreen." },
  { bands: ALL, name: "Rhinoceros", spec: { plan: "custom", id: "rhino" }, lives: "African and Asian grasslands", size: "Up to 1.8 m tall", fact: "A rhino’s horn is made of keratin, the same stuff as your fingernails." },
  { bands: ALL, name: "Camel", spec: { plan: "custom", id: "camel" }, lives: "Deserts of Asia and Africa", size: "About 2 m tall at the hump", fact: "A camel’s hump stores fat, not water, which it uses as energy." },
  { bands: ALL, name: "Horse", spec: { plan: "custom", id: "horse" }, lives: "Farms, plains and ranches", size: "About 1.6 m tall at the shoulder", fact: "A horse can sleep standing up by locking its leg joints." },
  { bands: ALL, name: "Cow", spec: { plan: "custom", id: "cow" }, lives: "Farms around the world", size: "About 1.4 m tall at the shoulder", fact: "Cows have best friends and get stressed when they are separated." },
  { bands: ALL, name: "Pig", spec: { plan: "custom", id: "pig" }, lives: "Farms around the world", size: "About 0.9 m tall", fact: "Pigs are among the smartest farm animals and can learn their own names." },
  { bands: ALL, name: "Sheep", spec: { plan: "custom", id: "sheep" }, lives: "Hills and farms worldwide", size: "About 0.8 m tall", fact: "Sheep can recognise and remember up to 50 other sheep faces." },
  { bands: ALL, name: "Dog", spec: { plan: "custom", id: "dog" }, lives: "Homes and farms everywhere", size: "Varies: from 15 cm to 90 cm tall", fact: "A dog’s sense of smell is about 10,000 to 100,000 times stronger than yours." },
  { bands: ALL, name: "Cat", spec: { plan: "custom", id: "cat" }, lives: "Homes and wild places everywhere", size: "About 25 cm tall", fact: "A cat’s whiskers are as wide as its body, so it knows if it can squeeze through a gap." },
  { bands: ALL, name: "Rabbit", spec: { plan: "custom", id: "rabbit" }, lives: "Meadows, woods and burrows", size: "About 40 cm long", fact: "A rabbit’s teeth never stop growing, so chewing keeps them short." },
  { bands: ALL, name: "Fox", spec: { plan: "custom", id: "fox" }, lives: "Forests, fields and even cities", size: "About 40 cm tall; tail is half its length", fact: "Foxes can hear a mouse squeaking under a metre of snow." },
  { bands: ALL, name: "Wolf", spec: { plan: "custom", id: "wolf" }, lives: "Forests and tundra of the north", size: "About 80 cm tall at the shoulder", fact: "Wolves in a pack howl so others know where they are." },
  { bands: ALL, name: "Brown Bear", spec: { plan: "custom", id: "bear" }, lives: "Forests and mountains of North America, Europe and Asia", size: "Up to 2.5 m when standing tall", fact: "A bear can smell food from more than 1.5 km away." },
  { bands: ALL, name: "Giant Panda", spec: { plan: "custom", id: "panda" }, lives: "Bamboo forests of China", size: "About 1.5 m long", fact: "A panda eats bamboo for up to 14 hours every day." },
  { bands: ALL, name: "Deer", spec: { plan: "custom", id: "deer" }, lives: "Forests and meadows", size: "About 1.2 m tall at the shoulder", fact: "A male deer regrows a brand-new set of antlers every single year." },
  { bands: ALL, name: "Monkey", spec: { plan: "custom", id: "monkey" }, lives: "Tropical forests", size: "About 50 cm tall", fact: "Many monkeys use their long tails like an extra hand for gripping branches." },
  { bands: ALL, name: "Kangaroo", spec: { plan: "custom", id: "kangaroo" }, lives: "Grasslands of Australia", size: "Up to 1.8 m tall", fact: "A kangaroo can’t walk backwards, which is why it appears on Australia’s coat of arms." },
  { bands: ALL, name: "Skunk", spec: { plan: "custom", id: "skunk" }, lives: "Woods and fields of the Americas", size: "About 50 cm long", fact: "A skunk warns first by stamping and lifting its tail before it ever sprays." },
  { bands: ALL, name: "Raccoon", spec: { plan: "custom", id: "raccoon" }, lives: "Woods and towns in North America", size: "About 60 cm long", fact: "A raccoon’s front paws are so sensitive it seems to see with its fingers." },
  { bands: ALL, name: "Hedgehog", spec: { plan: "custom", id: "hedgehog" }, lives: "Gardens and woods of Europe", size: "About 25 cm long", fact: "A hedgehog has around 5,000 spines, and it rolls into a ball when scared." },
  { bands: ALL, name: "Penguin", spec: B({ beak: "pointy", legs: "short", penguin: true, tail: "short" }), lives: "Cold coasts of the Southern Hemisphere", size: "Emperor penguins are 1.1 m tall", fact: "Penguins can’t fly in the air, but they ‘fly’ underwater at up to 20 km/h." },
  { bands: ALL, name: "Owl", spec: B({ beak: "short", legs: "short", owl: true, tail: "short" }), lives: "Forests, deserts and farms on almost every continent", size: "From 13 cm to 70 cm tall", fact: "An owl can turn its head about 270 degrees to look behind it." },
  { bands: ALL, name: "Flamingo", spec: { plan: "custom", id: "flamingo" }, lives: "Shallow lakes and lagoons", size: "About 1.2 m tall", fact: "Flamingos are born grey and turn pink from the food they eat." },
  { bands: ALL, name: "Toucan", spec: { plan: "custom", id: "toucan" }, lives: "Rainforests of Central and South America", size: "About 60 cm long", fact: "A toucan’s huge beak is light because it’s mostly hollow, and helps it cool down." },
  { bands: ALL, name: "Peacock", spec: { plan: "custom", id: "peacock" }, lives: "Forests and farms of South Asia", size: "Up to 2 m long including the tail", fact: "Only male peacocks have the big, shimmering tail feathers." },
  { bands: ALL, name: "Duck", spec: { plan: "custom", id: "duck" }, lives: "Ponds, rivers and lakes", size: "About 50 cm long", fact: "A duck’s feathers are waterproofed with oil so it stays dry." },
  { bands: ALL, name: "Eagle", spec: { plan: "custom", id: "eagle" }, lives: "Mountains, forests and coasts", size: "Wings stretch up to 2.3 m", fact: "An eagle can spot a rabbit from more than 3 km away." },
  { bands: ALL, name: "Pelican", spec: { plan: "custom", id: "pelican" }, lives: "Coasts and lakes", size: "Wings stretch up to 3 m", fact: "A pelican’s beak pouch can hold more water than its stomach can." },
  { bands: ALL, name: "Shark", spec: { plan: "custom", id: "shark" }, lives: "Oceans all over the world", size: "From 20 cm to 12 m (the whale shark)", fact: "Sharks have skeletons made of cartilage, like the tip of your nose, not bone." },
  { bands: ALL, name: "Clownfish", spec: Fi("clown"), lives: "Warm coral reefs", size: "About 10 cm long", fact: "Clownfish live safely among stinging anemones that other fish avoid." },
  { bands: ALL, name: "Blue Whale", spec: Fi("whale"), lives: "Oceans worldwide", size: "Up to 30 m long; the biggest animal ever", fact: "A blue whale’s heart is about as big as a small car." },
  { bands: ALL, name: "Dolphin", spec: { plan: "custom", id: "dolphin" }, lives: "Oceans and some rivers", size: "About 2.5 m long", fact: "Dolphins sleep with half their brain awake so they can keep breathing." },
  { bands: ALL, name: "Seahorse", spec: { plan: "custom", id: "seahorse" }, lives: "Shallow, warm seas", size: "From 2 cm to 35 cm", fact: "It’s the male seahorse who carries the babies, in a pouch on his belly." },
  { bands: ALL, name: "Goldfish", spec: Fi("fish"), lives: "Ponds and fish bowls", size: "About 15 cm long", fact: "Goldfish can remember things for months, not three seconds as the myth says." },
  { bands: ALL, name: "Octopus", spec: M("octopus"), lives: "Seas and ocean floors", size: "From 5 cm to 5 m across", fact: "An octopus has three hearts and blue blood." },
  { bands: ALL, name: "Jellyfish", spec: M("jelly"), lives: "Oceans everywhere", size: "From 1 mm to 2 m wide", fact: "Jellyfish have no brain, no heart and no bones, and are about 95% water." },
  { bands: ALL, name: "Crab", spec: M("crab"), lives: "Beaches and oceans", size: "From 1 cm to 3.8 m (leg span of the giant spider crab)", fact: "Crabs walk sideways because of how their legs are built." },
  { bands: ALL, name: "Starfish", spec: M("star"), lives: "Seashores and ocean floors", size: "From 2 cm to 1 m wide", fact: "A starfish has no brain and no blood, and can regrow a lost arm." },
  { bands: ALL, name: "Sea Turtle", spec: { plan: "custom", id: "turtle" }, lives: "Warm oceans", size: "Up to 1.8 m long", fact: "Sea turtles return to the very beach where they hatched to lay their own eggs." },
  { bands: ALL, name: "Frog", spec: M("frog"), lives: "Ponds, forests and wetlands", size: "From 1 cm to 30 cm", fact: "A frog blinks to push food down its throat — its eyes help it swallow!" },
  { bands: ALL, name: "Snake", spec: { plan: "custom", id: "snake" }, lives: "Nearly every continent except Antarctica", size: "From 10 cm to 9 m", fact: "Snakes smell with their tongues, flicking them out to taste the air." },
  { bands: ALL, name: "Butterfly", spec: M("butterfly"), lives: "Gardens and meadows worldwide", size: "Wings span 2 cm to 30 cm", fact: "Butterflies taste with their feet." },
  { bands: ALL, name: "Ladybug", spec: M("ladybug"), lives: "Gardens and fields", size: "About 8 mm long", fact: "One ladybug can eat thousands of tiny aphids in its life." },
  { bands: ALL, name: "Honeybee", spec: M("bee"), lives: "Hives, gardens and meadows", size: "About 1.5 cm long", fact: "A honeybee visits about 2 million flowers to make one jar of honey with its hive." },
  { bands: ALL, name: "Spider", spec: { plan: "custom", id: "spider" }, lives: "Almost everywhere on land", size: "From 0.5 mm to 30 cm leg span", fact: "A spider has eight legs and is not an insect; insects have six." },
  { bands: ALL, name: "Snail", spec: M("snail"), lives: "Gardens, forests and seas", size: "From 1 mm to 30 cm", fact: "A snail has thousands of tiny teeth on its tongue." },
];
