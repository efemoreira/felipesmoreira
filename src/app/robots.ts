import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/_next/", "/api/"],
    },
    sitemap: "https://felipesmoreira.com/sitemap.xml",
    host: "https://felipesmoreira.com",
  };
}

export const dynamic = "force-static";
