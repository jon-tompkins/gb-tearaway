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

export const ANIMALS: AnimalEntry[] = [
  { bands: ALL, name: "Elephant", spec: { plan: "openmoji", id: "1F418" }, lives: "African and Asian grasslands and forests", size: "Up to 3.5 m tall; the biggest land animal", fact: "An elephant’s trunk has around 40,000 muscles and can pick up a single peanut." },
  { bands: ALL, name: "Giraffe", spec: { plan: "openmoji", id: "1F992" }, lives: "African savannas", size: "Up to 5.5 m tall; the tallest animal", fact: "A giraffe has the same number of neck bones as you: seven. They are just very long." },
  { bands: ALL, name: "Lion", spec: { plan: "openmoji", id: "1F981" }, lives: "African grasslands", size: "About 1.2 m tall at the shoulder", fact: "A lion’s roar can be heard from about 8 km away." },
  { bands: ALL, name: "Tiger", spec: { plan: "openmoji", id: "1F405" }, lives: "Forests and grasslands of Asia", size: "Up to 3 m long, the largest wild cat", fact: "No two tigers have the same stripes, and the stripes go all the way into the skin." },
  { bands: ALL, name: "Zebra", spec: { plan: "openmoji", id: "1F993" }, lives: "African grasslands", size: "About 1.3 m tall at the shoulder", fact: "A zebra’s stripe pattern is unique, like your fingerprint." },
  { bands: ALL, name: "Hippopotamus", spec: { plan: "openmoji", id: "1F99B" }, lives: "Rivers and lakes of Africa", size: "Up to 1.5 m tall; weighs as much as a small car", fact: "A hippo’s sweat is a reddish oil that works like sunscreen." },
  { bands: ALL, name: "Rhinoceros", spec: { plan: "openmoji", id: "1F98F" }, lives: "African and Asian grasslands", size: "Up to 1.8 m tall", fact: "A rhino’s horn is made of keratin, the same stuff as your fingernails." },
  { bands: ALL, name: "Camel", spec: { plan: "openmoji", id: "1F42A" }, lives: "Deserts of Asia and Africa", size: "About 2 m tall at the hump", fact: "A camel’s hump stores fat, not water, which it uses as energy." },
  { bands: ALL, name: "Horse", spec: { plan: "openmoji", id: "1F40E" }, lives: "Farms, plains and ranches", size: "About 1.6 m tall at the shoulder", fact: "A horse can sleep standing up by locking its leg joints." },
  { bands: ALL, name: "Cow", spec: { plan: "openmoji", id: "1F404" }, lives: "Farms around the world", size: "About 1.4 m tall at the shoulder", fact: "Cows have best friends and get stressed when they are separated." },
  { bands: ALL, name: "Pig", spec: { plan: "openmoji", id: "1F416" }, lives: "Farms around the world", size: "About 0.9 m tall", fact: "Pigs are among the smartest farm animals and can learn their own names." },
  { bands: ALL, name: "Sheep", spec: { plan: "openmoji", id: "1F411" }, lives: "Hills and farms worldwide", size: "About 0.8 m tall", fact: "Sheep can recognise and remember up to 50 other sheep faces." },
  { bands: ALL, name: "Dog", spec: { plan: "openmoji", id: "1F436" }, lives: "Homes and farms everywhere", size: "Varies: from 15 cm to 90 cm tall", fact: "A dog’s sense of smell is about 10,000 to 100,000 times stronger than yours." },
  { bands: ALL, name: "Cat", spec: { plan: "openmoji", id: "1F431" }, lives: "Homes and wild places everywhere", size: "About 25 cm tall", fact: "A cat’s whiskers are as wide as its body, so it knows if it can squeeze through a gap." },
  { bands: ALL, name: "Rabbit", spec: { plan: "openmoji", id: "1F407" }, lives: "Meadows, woods and burrows", size: "About 40 cm long", fact: "A rabbit’s teeth never stop growing, so chewing keeps them short." },
  { bands: ALL, name: "Fox", spec: { plan: "openmoji", id: "1F98A" }, lives: "Forests, fields and even cities", size: "About 40 cm tall; tail is half its length", fact: "Foxes can hear a mouse squeaking under a metre of snow." },
  { bands: ALL, name: "Wolf", spec: { plan: "openmoji", id: "1F43A" }, lives: "Forests and tundra of the north", size: "About 80 cm tall at the shoulder", fact: "Wolves in a pack howl so others know where they are." },
  { bands: ALL, name: "Brown Bear", spec: { plan: "openmoji", id: "1F43B" }, lives: "Forests and mountains of North America, Europe and Asia", size: "Up to 2.5 m when standing tall", fact: "A bear can smell food from more than 1.5 km away." },
  { bands: ALL, name: "Giant Panda", spec: { plan: "openmoji", id: "1F43C" }, lives: "Bamboo forests of China", size: "About 1.5 m long", fact: "A panda eats bamboo for up to 14 hours every day." },
  { bands: ALL, name: "Deer", spec: { plan: "openmoji", id: "1F98C" }, lives: "Forests and meadows", size: "About 1.2 m tall at the shoulder", fact: "A male deer regrows a brand-new set of antlers every single year." },
  { bands: ALL, name: "Monkey", spec: { plan: "openmoji", id: "1F412" }, lives: "Tropical forests", size: "About 50 cm tall", fact: "Many monkeys use their long tails like an extra hand for gripping branches." },
  { bands: ALL, name: "Kangaroo", spec: { plan: "openmoji", id: "1F998" }, lives: "Grasslands of Australia", size: "Up to 1.8 m tall", fact: "A kangaroo can’t walk backwards, which is why it appears on Australia’s coat of arms." },
  { bands: ALL, name: "Skunk", spec: { plan: "openmoji", id: "1F9A8" }, lives: "Woods and fields of the Americas", size: "About 50 cm long", fact: "A skunk warns first by stamping and lifting its tail before it ever sprays." },
  { bands: ALL, name: "Raccoon", spec: { plan: "openmoji", id: "1F99D" }, lives: "Woods and towns in North America", size: "About 60 cm long", fact: "A raccoon’s front paws are so sensitive it seems to see with its fingers." },
  { bands: ALL, name: "Hedgehog", spec: { plan: "openmoji", id: "1F994" }, lives: "Gardens and woods of Europe", size: "About 25 cm long", fact: "A hedgehog has around 5,000 spines, and it rolls into a ball when scared." },
  { bands: ALL, name: "Penguin", spec: { plan: "openmoji", id: "1F427" }, lives: "Cold coasts of the Southern Hemisphere", size: "Emperor penguins are 1.1 m tall", fact: "Penguins can’t fly in the air, but they ‘fly’ underwater at up to 20 km/h." },
  { bands: ALL, name: "Owl", spec: { plan: "openmoji", id: "1F989" }, lives: "Forests, deserts and farms on almost every continent", size: "From 13 cm to 70 cm tall", fact: "An owl can turn its head about 270 degrees to look behind it." },
  { bands: ALL, name: "Flamingo", spec: { plan: "openmoji", id: "1F9A9" }, lives: "Shallow lakes and lagoons", size: "About 1.2 m tall", fact: "Flamingos are born grey and turn pink from the food they eat." },
  { bands: ALL, name: "Parrot", spec: { plan: "openmoji", id: "1F99C" }, lives: "Tropical forests worldwide", size: "From 10 cm to 1 m long", fact: "Some parrots can copy human words, and they use their feet like hands to hold food." },
  { bands: ALL, name: "Peacock", spec: { plan: "openmoji", id: "1F99A" }, lives: "Forests and farms of South Asia", size: "Up to 2 m long including the tail", fact: "Only male peacocks have the big, shimmering tail feathers." },
  { bands: ALL, name: "Duck", spec: { plan: "openmoji", id: "1F986" }, lives: "Ponds, rivers and lakes", size: "About 50 cm long", fact: "A duck’s feathers are waterproofed with oil so it stays dry." },
  { bands: ALL, name: "Eagle", spec: { plan: "openmoji", id: "1F985" }, lives: "Mountains, forests and coasts", size: "Wings stretch up to 2.3 m", fact: "An eagle can spot a rabbit from more than 3 km away." },
  { bands: ALL, name: "Swan", spec: { plan: "openmoji", id: "1F9A2" }, lives: "Lakes, rivers and ponds", size: "Up to 1.5 m long; wings span about 2.4 m", fact: "A baby swan is called a cygnet, and swans often stay with the same partner for life." },
  { bands: ALL, name: "Shark", spec: { plan: "openmoji", id: "1F988" }, lives: "Oceans all over the world", size: "From 20 cm to 12 m (the whale shark)", fact: "Sharks have skeletons made of cartilage, like the tip of your nose, not bone." },
  { bands: ALL, name: "Angelfish", spec: { plan: "openmoji", id: "1F420" }, lives: "Warm rivers and coral reefs", size: "About 15 cm long", fact: "Angelfish are tall and thin, which helps them slip between plants and coral." },
  { bands: ALL, name: "Blue Whale", spec: { plan: "openmoji", id: "1F433" }, lives: "Oceans worldwide", size: "Up to 30 m long; the biggest animal ever", fact: "A blue whale’s heart is about as big as a small car." },
  { bands: ALL, name: "Dolphin", spec: { plan: "openmoji", id: "1F42C" }, lives: "Oceans and some rivers", size: "About 2.5 m long", fact: "Dolphins sleep with half their brain awake so they can keep breathing." },
  { bands: ALL, name: "Llama", spec: { plan: "openmoji", id: "1F999" }, lives: "Mountains of South America", size: "About 1.2 m tall at the shoulder", fact: "Llamas hum to each other, and farmers use them to carry loads along mountain paths." },
  { bands: ALL, name: "Goldfish", spec: { plan: "openmoji", id: "1F41F" }, lives: "Ponds and fish bowls", size: "About 15 cm long", fact: "Goldfish can remember things for months, not three seconds as the myth says." },
  { bands: ALL, name: "Octopus", spec: { plan: "openmoji", id: "1F419" }, lives: "Seas and ocean floors", size: "From 5 cm to 5 m across", fact: "An octopus has three hearts and blue blood." },
  { bands: ALL, name: "Jellyfish", spec: { plan: "openmoji", id: "1FABC" }, lives: "Oceans everywhere", size: "From 1 mm to 2 m wide", fact: "Jellyfish have no brain, no heart and no bones, and are about 95% water." },
  { bands: ALL, name: "Crab", spec: { plan: "openmoji", id: "1F980" }, lives: "Beaches and oceans", size: "From 1 cm to 3.8 m (leg span of the giant spider crab)", fact: "Crabs walk sideways because of how their legs are built." },
  { bands: ALL, name: "Squirrel", spec: { plan: "openmoji", id: "1F43F" }, lives: "Forests, parks and gardens", size: "About 20 cm long, plus a tail nearly as long", fact: "Squirrels bury thousands of nuts each autumn and forget some, which grow into new trees." },
  { bands: ALL, name: "Sea Turtle", spec: { plan: "openmoji", id: "1F422" }, lives: "Warm oceans", size: "Up to 1.8 m long", fact: "Sea turtles return to the very beach where they hatched to lay their own eggs." },
  { bands: ALL, name: "Frog", spec: { plan: "openmoji", id: "1F438" }, lives: "Ponds, forests and wetlands", size: "From 1 cm to 30 cm", fact: "A frog blinks to push food down its throat — its eyes help it swallow!" },
  { bands: ALL, name: "Snake", spec: { plan: "openmoji", id: "1F40D" }, lives: "Nearly every continent except Antarctica", size: "From 10 cm to 9 m", fact: "Snakes smell with their tongues, flicking them out to taste the air." },
  { bands: ALL, name: "Butterfly", spec: { plan: "openmoji", id: "1F98B" }, lives: "Gardens and meadows worldwide", size: "Wings span 2 cm to 30 cm", fact: "Butterflies taste with their feet." },
  { bands: ALL, name: "Ladybug", spec: { plan: "openmoji", id: "1F41E" }, lives: "Gardens and fields", size: "About 8 mm long", fact: "One ladybug can eat thousands of tiny aphids in its life." },
  { bands: ALL, name: "Honeybee", spec: { plan: "openmoji", id: "1F41D" }, lives: "Hives, gardens and meadows", size: "About 1.5 cm long", fact: "A honeybee visits about 2 million flowers to make one jar of honey with its hive." },
  { bands: ALL, name: "Spider", spec: { plan: "openmoji", id: "1F577" }, lives: "Almost everywhere on land", size: "From 0.5 mm to 30 cm leg span", fact: "A spider has eight legs and is not an insect; insects have six." },
  { bands: ALL, name: "Snail", spec: { plan: "openmoji", id: "1F40C" }, lives: "Gardens, forests and seas", size: "From 1 mm to 30 cm", fact: "A snail has thousands of tiny teeth on its tongue." },
];
