import type { Metadata } from "next";
import HeroisClient from "@/features/herois/HeroisClient";
import { heroes } from "@/features/herois/data";

export const metadata: Metadata = {
  title: "Heróis do Ceará",
  description:
    "Cordel dos que fizeram nossa história: conheça os heróis históricos do Ceará, suas histórias, legados e impactos na formação cultural do estado.",
  alternates: { canonical: "https://felipesmoreira.com/herois-do-ceara" },
  openGraph: {
    title: "Heróis do Ceará — Missão Ceará",
    description:
      "Cordel dos que fizeram nossa história: da fundação do Ceará à cultura que o mundo conhece.",
  },
};

/**
 * As 31 fichas viram uma lista de `Person` para o buscador.
 *
 * Fica aqui, na rota (que é componente de servidor), e não no `HeroisClient`:
 * o JSON-LD precisa estar no HTML estático que o rastreador lê, e não depois
 * que o JavaScript roda.
 *
 * `birthDate`/`deathDate` de propósito **não entram**: o dado é histórico e vem
 * como "c. 1586" ou "séc. XVI", que não é data ISO. Schema com data inventada
 * é pior que schema sem data.
 */
const listaDeHerois = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Heróis do Ceará",
  description:
    "Figuras históricas que formaram o Ceará, da fundação à cultura — com contexto, ações e legado.",
  numberOfItems: heroes.length,
  itemListElement: heroes.map((h, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Person",
      name: h.name,
      alternateName: h.nickname,
      birthPlace: h.birthPlace,
      deathPlace: h.deathPlace,
      description: h.legacy,
      knowsAbout: h.category,
    },
  })),
};

export default function HeroisDoCearaPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(listaDeHerois) }}
      />
      <HeroisClient />
    </>
  );
}
