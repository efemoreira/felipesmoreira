import type { Metadata } from "next";
import ProgramacaoClient from "./ProgramacaoClient";
import type { Agenda } from "./tipos";
import data from "@/data/programacao.json";

/* Conteúdo do build — serve de semente para o SEO e de reserva caso o painel
   ainda não tenha publicado nada. Ver src/data/programacao.json e /painel. */
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
};

export default function ProgramacaoPage() {
  return <ProgramacaoClient semente={semente} />;
}
