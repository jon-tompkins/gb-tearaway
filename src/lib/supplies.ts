/**
 * Supplies page content. Links are Amazon *search* URLs with Jon's Associates
 * tag appended (set AMAZON_TAG on Vercel). To pin a specific product, replace
 * `query` with a full `url` ending in `?tag=` + tag.
 */
export interface SupplyItem {
  name: string;
  blurb: string;
  query: string;
}

export interface SupplyGroup {
  id: string;
  title: string;
  intro: string;
  items: SupplyItem[];
}

export const SUPPLY_GROUPS: SupplyGroup[] = [
  {
    id: "thermal",
    title: "Ink-free thermal printers",
    intro:
      "Thermal printers use heat instead of ink, so there are no cartridges to buy and nothing to dry out. You only ever buy paper. Look for one that takes standard US Letter (8.5×11) sheets, which is the size Back of the Box is made for.",
    items: [
      { name: "Portable Letter-size thermal printer", blurb: "Wireless, fits on a shelf, prints a full page.", query: "portable thermal printer 8.5x11 letter wireless" },
      { name: "Phomemo Letter/A4 thermal printer", blurb: "A popular, well-reviewed brand for this kind of printer.", query: "Phomemo thermal printer letter size" },
    ],
  },
  {
    id: "thermal-paper",
    title: "Thermal paper",
    intro: "Match the paper to your printer. Many Letter thermal printers use black-mark fanfold paper: a zig-zag stack with small black marks on the back that tell the printer where each page starts. In the printer's app, choose \"Black Mark Fanfold\" and the Letter size. Thermal prints fade over a few months, which is fine for a daily page that ends up on the fridge.",
    items: [
      { name: "Black-mark fanfold thermal paper, 8.5×11", blurb: "The zig-zag stack with black marks on the back. Check your printer takes it.", query: "black mark fanfold thermal paper 8.5x11" },
      { name: "Single-sheet thermal paper, 8.5×11", blurb: "Loose sheets with no marks, for printers set to sheet-fed.", query: "thermal paper sheets 8.5x11 letter" },
    ],
  },
  {
    id: "regular",
    title: "Prefer a regular printer?",
    intro: "Any home printer works fine. If you're buying new, a monochrome laser is the cheapest per page for a daily printout, and the toner lasts far longer than inkjet cartridges.",
    items: [
      { name: "Wi-Fi monochrome laser printer", blurb: "Cheap per page, toner doesn't dry out.", query: "wifi monochrome laser printer home" },
      { name: "Printer paper, 8.5×11", blurb: "A ream lasts months at one page a day.", query: "printer paper 8.5x11 20lb" },
    ],
  },
];

export const amazonUrl = (query: string, tag = process.env.AMAZON_TAG) =>
  `https://www.amazon.com/s?k=${encodeURIComponent(query)}${tag ? `&tag=${encodeURIComponent(tag)}` : ""}`;
