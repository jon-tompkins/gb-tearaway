/** Shared by the landing page and /faq. Keep src/lib/supportKnowledge.ts in sync. */
export interface FaqItem {
  q: string;
  a: string;
  href?: string;
  cta?: string;
}

export const FAQ: FaqItem[] = [
  {
    q: "What does it cost?",
    a: "Your first month is free. After that it’s $20 a year for up to two kids, or $40 a year for up to five. Prefer to pay as you go? It’s $6 a quarter for up to two kids, or $12 a quarter for up to five. Sign in with Google to save your setup and get a page every morning.",
  },
  {
    q: "What do I need to print it?",
    a: "Any home printer works, since the page is made for US Letter.",
  },
  {
    q: "I don’t have a printer. How do I get started?",
    a: "No problem. An ink-free thermal printer costs less than a tank of ink and never runs dry, which is the real selling point. Our supplies page explains how they work and lists printers and paper we like.",
    href: "/supplies",
    cta: "See printers and paper →",
  },
  {
    q: "What ages is it for?",
    a: "About 4 to 12. You set an age when you make the page, and each card has its own 1–20 dial. Sudoku goes from 4×4 up to 9×9, mazes grow, and news cards start at level 5.",
  },
  {
    q: "Where does the news come from?",
    a: "From real outlets: Smithsonian, NASA, Science News Explores, Mongabay, Popular Science, IEEE Spectrum, Good News Network, and others. Each story is rewritten for kids, checked against the source article, and printed with its location. Crime, politics, and anything scary are left out.",
  },
  {
    q: "Does my kid need an account or a screen?",
    a: "No. Parents set it up, and kids just get the paper. We only ask for the kid’s first name, and there are no ads.",
  },
  {
    q: "Can I make pages for more than one kid?",
    a: "Yes. Each kid gets their own page with its own cards, difficulty, and delivery time.",
  },
];
