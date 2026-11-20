import type { MetadataRoute } from "next";
import { freeEditionGate } from "@/lib/free/runtime";
import { MODULE_CATALOG } from "@/lib/modules";

const BASE = "https://www.backofthebox.xyz";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = ["", "/about", "/modules", "/faq", "/supplies", "/privacy", "/terms", ...((await freeEditionGate()).ok ? ["/free"] : [])].map((p) => ({
    url: `${BASE}${p}`,
    changeFrequency: "weekly" as const,
  }));
  const mods = MODULE_CATALOG.map((m) => ({ url: `${BASE}/modules/${m.id}`, changeFrequency: "monthly" as const }));
  return [...pages, ...mods];
}
