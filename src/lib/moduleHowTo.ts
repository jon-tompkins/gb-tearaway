import type { ModuleId } from "./types";

/**
 * Short "how to play" steps for the modules where the rules aren't obvious.
 * Shown on the module's detail page. Modules without an entry (facts, news,
 * weather, jokes…) need no instructions.
 */
export const MODULE_HOW_TO: Partial<Record<ModuleId, string[]>> = {
  maze: [
    "Start at the marked start in the top-left corner and find a path to the finish.",
    "Trace it with a pencil. If you hit a dead end, back up and try another turn.",
  ],
  wordfind: [
    "Find every word from the list hidden in the letter grid.",
    "Words run across or down. On harder levels they can also run backward or diagonally.",
    "Circle each word as you find it, then cross it off the list.",
  ],
  dots: [
    "Start at dot 1 and draw a line to dot 2, then 3, and keep going in number order.",
    "Keep going to the last dot, then read the caption and color your picture in.",
  ],
  riddle: [
    "Read the riddle and think before you peek. Say your guess out loud.",
    "The answer isn't on the paper. Open the app or scan the page's QR code to check.",
  ],
  sudoku: [
    "Fill every empty square so each row, each column and each box has every number exactly once.",
    "Start with rows, columns or boxes that are almost full. Every puzzle has exactly one answer, so no guessing needed.",
    "Check your answer in the app.",
  ],
  sequence: [
    "Look at how the numbers change from one to the next. The jump might be adding, multiplying, or something trickier.",
    "Work out the rule, then write the next number.",
    "Check your answer in the app.",
  ],
  crossword: [
    "Read a clue, then write its answer in the grid, one letter per square.",
    "Across clues go left to right, Down clues go top to bottom.",
    "Words cross each other, so a letter you know can help with a tricky clue.",
    "Check your answers in the app.",
  ],
  battleship: [
    "A hidden fleet is on the grid. The numbers beside each row and column say how many squares in that line hold a ship piece.",
    "Ships are straight and never touch each other, not even at the corners.",
    "Use the counts and any starting hints to figure out where every ship goes. There is exactly one solution.",
  ],
  scramble: [
    "The letters of a word have been shuffled. Unscramble them to spell the word.",
    "Use the hint if you get stuck.",
    "Check your answer in the app.",
  ],
  usstate: [
    "Look at the outline. Can you name the state? The star marks the capital city.",
    "Easy cards give you the name. Harder ones show only the shape.",
    "Check your answer in the app.",
  ],
  country_eu: [
    "Look at the outline. Can you name the country and its capital?",
    "Easy cards give you the name and star the capital. Harder ones show only the shape.",
    "Check your answer in the app.",
  ],
  country_af: [
    "Look at the outline. Can you name the country and its capital?",
    "Easy cards give you the name and star the capital. Harder ones show only the shape.",
    "Check your answer in the app.",
  ],
  country_asia_oce: [
    "Look at the outline. Can you name the country and its capital?",
    "Easy cards give you the name and star the capital. Harder ones show only the shape.",
    "Check your answer in the app.",
  ],
  country_americas: [
    "Look at the outline. Can you name the country and its capital?",
    "Easy cards give you the name and star the capital. Harder ones show only the shape.",
    "Check your answer in the app.",
  ],
  numbercross: [
    "It works like a crossword, but every answer is a number and every clue is a quick calculation.",
    "Solve a clue and write one digit per square.",
    "Where two answers cross, they share a digit, so you can use one answer to check the other.",
    "Check your answers in the app.",
  ],
  cryptogram: [
    "A secret message has been written in code. Each letter stands for a different letter (or number).",
    "Use the key or the clue letters given to start. Fill in what you can, then use those letters to crack the rest.",
    "Short words like A, I and THE are good places to start.",
    "Check the decoded message in the app.",
  ],
  logicgrid: [
    "Match each person to the right pet, lunch or sport using the clues.",
    "In the grid, put an ✗ where something can't be true and a ✓ where it must be. Each person gets exactly one of each.",
    "Each clue is true, and there's exactly one solution, so no guessing.",
    "Check your answer in the app.",
  ],
  animal: [
    "Color in the animal, then read where it lives and the fun fact.",
    "Can you guess how big it is before you read the size?",
  ],
  planes: [
    "Color in the aircraft as seen from above, then read what it does and how big and fast it is.",
  ],
  tonguetwister: [
    "Read it slowly first, then say it three times, getting faster each time.",
    "Try not to trip. If you can say it fast without a mistake, you win.",
  ],
  spanish: [
    "Say the word out loud using the pronunciation guide, then read the sentence.",
    "Try using the word yourself today.",
  ],
};
