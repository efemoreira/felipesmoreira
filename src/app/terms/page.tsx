import type { Metadata } from "next";
import PaginaLegal from "@/features/legal/PaginaLegal";
import { titulo, resumo, atualizadoEm, secoes } from "@/features/legal/termos";

export const metadata: Metadata = {
  title: "Termos de Uso",
  description:
    "As regras de uso do site felipesmoreira.com e da área da militância da Missão Ceará.",
  alternates: { canonical: "https://felipesmoreira.com/terms" },
};

export default function TermosDeUso() {
  return <PaginaLegal titulo={titulo} resumo={resumo} atualizadoEm={atualizadoEm} secoes={secoes} />;
}
