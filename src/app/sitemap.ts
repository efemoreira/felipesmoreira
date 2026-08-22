import type { MetadataRoute } from "next";

const BASE = "https://felipesmoreira.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  /* Só o que é indexável entra. /plano, /aulas e /presenca declaram noindex
     na própria rota e ficam de fora de propósito — sitemap e robots dizendo
     coisas diferentes é o jeito mais rápido de confundir o buscador. */
  return [
    { url: `${BASE}`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/amissao`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/propostas`, lastModified: now, changeFrequency: "monthly", priority: 0.95 },
    { url: `${BASE}/candidatos`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/funcoes`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/queroajudar`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${BASE}/programacao`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/heroisdoceara`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}

export const dynamic = "force-static";
