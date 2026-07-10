import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Felipe Moreira — Missão Ceará · O Futuro é Glorioso",
    short_name: "Felipe Moreira",
    description:
      "Do mandacaru ao mar, do Ceará pro Brasil. A Missão Ceará, a história e as ideias que movem o sertão.",
    start_url: "/",
    display: "standalone",
    background_color: "#14110C",
    theme_color: "#181203",
    lang: "pt-BR",
    icons: [
      {
        src: "/image/me.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}

export const dynamic = "force-static";
