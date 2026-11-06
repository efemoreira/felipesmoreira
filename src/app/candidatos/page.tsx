import type { Metadata } from "next";
import CandidatosClient from "@/features/candidatos/CandidatosClient";

/* Indexável, ao contrário da Munição: "em que número votar" é a pergunta que o
   eleitor digita no buscador, e a resposta tem de estar aqui quando ele digitar. */
export const metadata: Metadata = {
  title: "Candidatos de 2026 — quem disputou pela Missão no Ceará",
  description:
    "Quem disputou pela Missão no Ceará em 2026: nome de urna, cargo, número e perfil de cada um.",
  alternates: { canonical: "https://felipesmoreira.com/candidatos" },
  openGraph: {
    title: "Candidatos de 2026 — quem disputou pela Missão no Ceará",
    description: "Nome de urna, cargo e número de cada candidato da Missão no Ceará na eleição de 2026.",
  },
  /* O X não herda do openGraph: sem isto o cartão dele mostra o título da raiz. */
  twitter: {
    title: "Candidatos de 2026 — quem disputou pela Missão no Ceará",
    description: "Nome de urna, cargo e número de cada candidato da Missão no Ceará na eleição de 2026.",
  },
};

export default function CandidatosPage() {
  return <CandidatosClient />;
}
