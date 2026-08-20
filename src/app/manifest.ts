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
    /* A marca das onças, não o retrato: ícone de app precisa ser quadrado e
       legível a 48 px. O 512 é o `src/app/icon.png`, que o Next publica na
       raiz. O maskable tem o conteúdo em 78% da moldura — sem essa folga o
       Android corta as orelhas das onças ao aplicar a máscara redonda.
       Ver originais/LEIA-ME.md para refazer os dois. */
    icons: [
      {
        src: "/image/icone-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/image/icone-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

export const dynamic = "force-static";
