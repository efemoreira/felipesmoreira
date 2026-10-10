import type { Metadata } from "next";
import Nucleos from "@/features/organizacao/Nucleos";

export const metadata: Metadata = {
  title: "Núcleos",
  description: "A Missão no seu bairro: os núcleos territoriais da militância no Ceará — onde funcionam, com que ritmo e como entrar.",
  alternates: { canonical: "https://felipesmoreira.com/nucleos" },
  openGraph: { title: "Núcleos — Missão Ceará", description: "A Missão no seu bairro: os núcleos territoriais da militância no Ceará — onde funcionam, com que ritmo e como entrar." },
  /* O X não herda do openGraph: sem isto o cartão dele mostra o título da raiz. */
  twitter: { title: "Núcleos — Missão Ceará", description: "A Missão no seu bairro: os núcleos territoriais da militância no Ceará — onde funcionam, com que ritmo e como entrar." },
};

export default function Pagina() {
  return <Nucleos />;
}
