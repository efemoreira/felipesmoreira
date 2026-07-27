import type { MetadataRoute } from "next";

const BASE = "https://felipesmoreira.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/herois-do-ceara`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/programacao`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}

export const dynamic = "force-static";
