import type { Metadata } from "next";
import Cultura from "@/features/organizacao/Cultura";

export const metadata: Metadata = {
  title: "Cultura",
  description: "A frente de Cultura da militância da Missão Ceará: música, cinema, cordel, jogos, esporte — grupos culturais da ideia ao grupo permanente.",
  alternates: { canonical: "https://felipesmoreira.com/cultura" },
  openGraph: { title: "Cultura — Missão Ceará", description: "Grupos culturais da militância: da ideia ao grupo permanente." },
  /* O X não herda do openGraph: sem isto o cartão dele mostra o título da raiz. */
  twitter: { title: "Cultura — Missão Ceará", description: "Grupos culturais da militância: da ideia ao grupo permanente." },
};

export default function Pagina() {
  return <Cultura />;
}
