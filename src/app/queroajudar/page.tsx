import type { Metadata } from "next";
import InscricaoClient from "@/features/inscricao/InscricaoClient";

export const metadata: Metadata = {
  title: "Quero ajudar",
  description:
    "Inscreva-se para ajudar a militância da Missão Ceará. Escolha como quer contribuir — comunicação, eventos ou onde precisar — e a coordenação entra em contato.",
  alternates: { canonical: "https://felipesmoreira.com/quero-ajudar" },
  openGraph: {
    title: "Quero ajudar — Missão Ceará",
    description:
      "Escolha por onde começar na militância da Missão Ceará. Tem lugar pra quem tem dez horas por semana e pra quem tem trinta minutos.",
  },
};

export default function QueroAjudarPage() {
  return <InscricaoClient />;
}
