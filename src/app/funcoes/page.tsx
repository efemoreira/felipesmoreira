import type { Metadata } from "next";
import FuncoesClient from "@/features/funcoes/FuncoesClient";

export const metadata: Metadata = {
  title: "O que dá pra fazer na militância",
  description:
    "As 12 funções da militância da Missão Ceará: Olheiro, Checagem, Roteirista, Design, Editor, Acervo, Local e Hora, Logística, Divulgação, Gravação e Recepção. O que cada uma entrega e quanto tempo pede.",
  alternates: { canonical: "https://felipesmoreira.com/funcoes" },
  openGraph: {
    title: "O que dá pra fazer na militância — Missão Ceará",
    description:
      "Cada função diz o que você entrega e quanto tempo pede, antes de você decidir. Tem lugar pra quem tem dez horas por semana e pra quem tem trinta minutos.",
  },
};

export default function FuncoesPage() {
  return <FuncoesClient />;
}
