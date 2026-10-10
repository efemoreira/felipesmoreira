import type { Metadata } from "next";
import PortaVozes from "@/features/organizacao/PortaVozes";

export const metadata: Metadata = {
  title: "Liga dos Porta-vozes",
  description: "Quem fala pela Missão no Ceará: a Liga dos Porta-vozes, os cinco níveis e o método — nas redes e na rua.",
  alternates: { canonical: "https://felipesmoreira.com/portavozes" },
  openGraph: { title: "Liga dos Porta-vozes — Missão Ceará", description: "Quem fala pela Missão no Ceará: a Liga dos Porta-vozes, os cinco níveis e o método — nas redes e na rua." },
  /* O X não herda do openGraph: sem isto o cartão dele mostra o título da raiz. */
  twitter: { title: "Liga dos Porta-vozes — Missão Ceará", description: "Quem fala pela Missão no Ceará: a Liga dos Porta-vozes, os cinco níveis e o método — nas redes e na rua." },
};

export default function Pagina() {
  return <PortaVozes />;
}
