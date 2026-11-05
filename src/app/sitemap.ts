import type { MetadataRoute } from "next";
import { MODULE_CATALOG } from "@/lib/modules";

const BASE = "https://www.backofthebox.xyz";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/about", "/modules", "/faq", "/supplies", "/privacy", "/terms"].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly" as const,
  }));
  const mods = MODULE_CATALOG.map((m) => ({ url: `${BASE}/modules/${m.id}`, changeFrequency: "monthly" as const }));
  return [...pages, ...mods];
}
