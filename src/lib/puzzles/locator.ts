import { COUNTRY_LOCATOR, LOCATOR_MAPS, LOCATOR_W, type LocatorRegion } from "./locator-data";

export const LOCATOR_LABEL: Record<LocatorRegion, string> = {
  us: "the US",
  europe: "Europe",
  africa: "Africa",
  americas: "the Americas",
  asia: "Asia",
  oceania: "Oceania",
};

/**
 * Small "where is it" map: the region outlined in white, the target filled
 * black, and a ring around it when it's too small to spot, captioned
 * "Where in Europe" etc. (SVG + caption HTML). Null if the target isn't on the map.
 */
export function locatorSvg(region: LocatorRegion, target: string): string | null {
  const map = LOCATOR_MAPS[region];
  const hit = map.shapes.find((s) => s.n === target);
  if (!hit) return null;
  const others = map.shapes.filter((s) => s !== hit).map((s) => s.d).join("");
  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${LOCATOR_W} ${map.h}" width="${LOCATOR_W}" height="${map.h}" role="img" aria-label="Map of ${LOCATOR_LABEL[region]}">`,
    `<path d="${others}" fill="#fff" stroke="#000" stroke-width="0.6" stroke-linejoin="round"/>`,
    `<path d="${hit.d}" fill="#000" stroke="#000" stroke-width="0.8" stroke-linejoin="round"/>`,
  ];
  if (hit.c) {
    const [cx, cy, r] = hit.c;
    parts.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#000" stroke-width="1.6"/>`);
  }
  parts.push("</svg>");
  parts.push(`<div class="geo-cap">Where in ${LOCATOR_LABEL[region]}</div>`);
  return parts.join("");
}

export function stateLocatorSvg(name: string): string | null {
  return locatorSvg("us", name);
}

export function countryLocatorSvg(name: string): string | null {
  const region = COUNTRY_LOCATOR[name];
  return region ? locatorSvg(region, name) : null;
}
