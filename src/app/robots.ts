import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/app", "/admin", "/api", "/settings", "/dashboard", "/strip"] }],
    sitemap: "https://www.backofthebox.xyz/sitemap.xml",
  };
}
