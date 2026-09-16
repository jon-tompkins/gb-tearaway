/**
 * Realistic mocked stock snapshot so the app runs offline-friendly.
 * Swap this module for a live quote feed later.
 */
import type { StockQuote } from "./types";
import { mulberry32 } from "./rng";

const TICKER_META: Record<string, { name: string; base: number }> = {
  AAPL: { name: "Apple", base: 228.4 },
  DIS: { name: "Disney", base: 98.2 },
  NKE: { name: "Nike", base: 87.5 },
  GOOGL: { name: "Alphabet", base: 176.1 },
  MSFT: { name: "Microsoft", base: 428.6 },
  TSLA: { name: "Tesla", base: 248.3 },
  AMZN: { name: "Amazon", base: 186.7 },
  META: { name: "Meta", base: 512.9 },
  NFLX: { name: "Netflix", base: 702.4 },
};

export function mockStocks(tickers: string[], seed: number): StockQuote[] {
  const rng = mulberry32(seed ^ 0x570c);
  return tickers.map((raw) => {
    const ticker = raw.toUpperCase().replace(/[^A-Z.]/g, "").slice(0, 8) || "DEMO";
    const meta = TICKER_META[ticker] ?? { name: ticker, base: 40 + rng() * 200 };
    const changePct = Math.round((rng() * 4 - 1.6) * 10) / 10;
    const price = Math.round(meta.base * (1 + changePct / 100) * 100) / 100;
    return { ticker, name: meta.name, price, changePct, demo: true as const };
  });
}
