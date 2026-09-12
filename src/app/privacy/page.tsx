import type { Metadata } from "next";
import PaginaLegal from "@/features/legal/PaginaLegal";
import { titulo, resumo, atualizadoEm, secoes } from "@/features/legal/privacidade";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description:
    "Como a Missão Ceará trata os dados de quem se inscreve para ajudar a militância e de quem participa dos encontros: o que é coletado, para quê, por quanto tempo e como pedir a exclusão.",
  alternates: { canonical: "https://felipesmoreira.com/privacy" },
};

export default function PoliticaDePrivacidade() {
  return <PaginaLegal titulo={titulo} resumo={resumo} atualizadoEm={atualizadoEm} secoes={secoes} />;
}
