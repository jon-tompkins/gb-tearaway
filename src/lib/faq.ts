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
    a: "Your first month is free. After that it’s one simple plan for up to five kids: $5 a month, or $39 a year (under $3.30 a month). Cancel anytime. Sign in with Google to save your setup and get a page every morning.",
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
    q: "Who is it for, and how hard is it?",
    a: "Anyone who likes a morning page. You choose a difficulty (Easier, Medium or Harder) when you make the page, with suggested ages of 4 to 12 as a starting point, and each card has its own 1–20 dial. Sudoku goes from 4×4 up to 9×9, mazes grow, and news cards start at level 5.",
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
  {
    q: "How does the page get to us?",
    a: "Every morning we email you a printable PDF, and you can also open it in the app. Print it on any printer, hand it over with a pencil, and breakfast gets a little smarter.",
  },
  {
    q: "Where are the answers?",
    a: "Behind a QR code on the page, or in the app, never printed on the sheet. Kids solve first, then you scan to check.",
  },
  {
    q: "Can I print a puzzle booklet for a binder?",
    a: "Yes. The Booklet tool makes a black-and-white PDF of mazes, word finds, or color-by-number pages (up to 60), with extra margin on the binding side so you can punch holes. It includes answer pages for mazes and word finds. Printing it at home is free.",
    href: "/app/booklet",
    cta: "Make a booklet →",
  },
];
