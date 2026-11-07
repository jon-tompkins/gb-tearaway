import type { AgeBand } from "../../types";

export interface DinoEntry {
  bands: AgeBand[];
  /** Must match a key in DINO_ART exactly. */
  name: string;
  /** Rounded figures, printed with "about". */
  lengthM: number;
  weightKg: number;
  diet: "Meat-eater" | "Plant-eater" | "Fish-eater";
  /** Geologic period + rough age. */
  when: string;
  fact: string;
  /** Only set for entries that are not true dinosaurs. */
  note?: string;
}
const ALL: AgeBand[] = ["4-6", "7-9", "10-12"];

export const DINOSAURS: DinoEntry[] = [
  { bands: ALL, name: "Tyrannosaurus rex", lengthM: 12, weightKg: 8000, diet: "Meat-eater", when: "Late Cretaceous, about 67 million years ago", fact: "Its arms were tiny, but its bite was one of the strongest of any land animal ever." },
  { bands: ALL, name: "Stegosaurus", lengthM: 9, weightKg: 5000, diet: "Plant-eater", when: "Late Jurassic, about 150 million years ago", fact: "The spikes on its tail even have a nickname: the thagomizer." },
  { bands: ALL, name: "Pteranodon", lengthM: 2, weightKg: 25, diet: "Fish-eater", when: "Late Cretaceous, about 80 million years ago", fact: "It was a flying reptile with a wingspan of about 6 m, and its beak had no teeth.", note: "Not a true dinosaur: Pteranodon was a pterosaur, a flying cousin." },
  { bands: ALL, name: "Triceratops", lengthM: 8, weightKg: 6000, diet: "Plant-eater", when: "Late Cretaceous, about 67 million years ago", fact: "Its name means three-horned face, and its huge bony frill grew behind its head." },
  { bands: ALL, name: "Brachiosaurus", lengthM: 22, weightKg: 30000, diet: "Plant-eater", when: "Late Jurassic, about 150 million years ago", fact: "Its front legs were longer than its back legs, so it stood with its neck tilted up like a giraffe." },
  { bands: ALL, name: "Ankylosaurus", lengthM: 7, weightKg: 6000, diet: "Plant-eater", when: "Late Cretaceous, about 67 million years ago", fact: "It was covered in bony armor and had a heavy club at the end of its tail." },
  { bands: ALL, name: "Spinosaurus", lengthM: 14, weightKg: 7000, diet: "Fish-eater", when: "Cretaceous, about 95 million years ago", fact: "It had a tall sail on its back and probably spent a lot of time in rivers hunting fish." },
  { bands: ALL, name: "Parasaurolophus", lengthM: 10, weightKg: 3000, diet: "Plant-eater", when: "Late Cretaceous, about 76 million years ago", fact: "The long crest on its head was hollow, and it may have used it to make deep, trumpet-like calls." },
  { bands: ALL, name: "Apatosaurus", lengthM: 22, weightKg: 20000, diet: "Plant-eater", when: "Late Jurassic, about 150 million years ago", fact: "Its tail was long and thin like a whip. Long ago, it was also known by the name Brontosaurus." },
  { bands: ALL, name: "Allosaurus", lengthM: 9, weightKg: 2000, diet: "Meat-eater", when: "Late Jurassic, about 150 million years ago", fact: "It was the top hunter of its time, millions of years before T. rex was born." },
  { bands: ALL, name: "Carnotaurus", lengthM: 8, weightKg: 1500, diet: "Meat-eater", when: "Late Cretaceous, about 70 million years ago", fact: "Its name means meat-eating bull, because of the two small horns above its eyes." },
  { bands: ALL, name: "Corythosaurus", lengthM: 9, weightKg: 4000, diet: "Plant-eater", when: "Late Cretaceous, about 77 million years ago", fact: "It had a round, helmet-shaped crest on its head and a flat, duck-like bill." },
  { bands: ALL, name: "Iguanodon", lengthM: 10, weightKg: 3000, diet: "Plant-eater", when: "Early Cretaceous, about 125 million years ago", fact: "It had a sharp thumb spike on each hand. It was one of the first dinosaurs ever given a name." },
  { bands: ALL, name: "Maiasaura", lengthM: 9, weightKg: 3000, diet: "Plant-eater", when: "Late Cretaceous, about 76 million years ago", fact: "Its name means good mother lizard, because fossil nests with baby Maiasaura were found." },
  { bands: ALL, name: "Styracosaurus", lengthM: 5, weightKg: 2700, diet: "Plant-eater", when: "Late Cretaceous, about 75 million years ago", fact: "A crown of long spikes stuck out from its neck frill, with one big horn on its nose." },
  { bands: ALL, name: "Troodon", lengthM: 3, weightKg: 50, diet: "Meat-eater", when: "Late Cretaceous, about 76 million years ago", fact: "It had big eyes and a large brain for a dinosaur, and was probably one of the smartest." },
  { bands: ALL, name: "Coelophysis", lengthM: 3, weightKg: 20, diet: "Meat-eater", when: "Late Triassic, about 210 million years ago", fact: "It was slim and quick, and lived near the very start of the age of dinosaurs." },
];
