import type { Metadata } from "next";
import ProgramacaoClient from "@/features/programacao/ProgramacaoClient";
import type { Agenda } from "@/features/programacao/tipos";
import data from "@/data/programacao.json";

/* A semente do build: a capa e os canais, SEM itens. O que se publica vem do
   painel (`dados/agenda.json`); itens escritos aqui ficavam meses no passado
   e o /programacao os filtrava de qualquer jeito. Ver src/data/programacao.json. */
const semente = data as Agenda;

export const metadata: Metadata = {
  title: "Programação da Semana",
  description:
    "Agenda da semana da Missão Ceará: lives, conversas e conteúdo de Felipe Moreira, com dia, horário e onde assistir.",
  alternates: { canonical: "https://felipesmoreira.com/programacao" },
  openGraph: {
    title: "Programação da Semana — Missão Ceará",
    description:
      "Todas as lives e conteúdos da semana de Felipe Moreira: dia, horário e plataforma.",
  },
  /* O X não herda do openGraph: sem isto o cartão dele mostra o título da raiz. */
  twitter: {
    title: "Programação da Semana — Missão Ceará",
    description:
      "Todas as lives e conteúdos da semana de Felipe Moreira: dia, horário e plataforma.",
  },
};

export default function ProgramacaoPage() {
  return <ProgramacaoClient semente={semente} />;
}
