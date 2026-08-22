import type { Metadata } from "next";
import CandidatosClient from "@/features/candidatos/CandidatosClient";

/* Indexável, ao contrário da Munição: "em que número votar" é a pergunta que o
   eleitor digita no buscador, e a resposta tem de estar aqui quando ele digitar. */
export const metadata: Metadata = {
  title: "Nossos candidatos — em que número votar",
  description:
    "Os candidatos da Missão no Ceará: nome de urna, cargo, número e perfil de cada um. "
    + "Monte a colinha e leve o número para a urna.",
  alternates: { canonical: "https://felipesmoreira.com/candidatos" },
};

export default function CandidatosPage() {
  return <CandidatosClient />;
}
