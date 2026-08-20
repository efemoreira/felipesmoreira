import type { Metadata } from "next";
import PropostasClient from "@/features/propostas/PropostasClient";

export const metadata: Metadata = {
  title: "Propostas — Plano de Governo",
  description:
    "Retomar para Reconstruir: o plano de governo da chapa Delegado Huggo Leonardo e Felipe Moreira para o Ceará. Sete compromissos com meta, prazo, fonte de custeio e indicador — página por página.",
  alternates: { canonical: "https://felipesmoreira.com/propostas" },
  openGraph: {
    title: "Retomar para Reconstruir — o plano de governo",
    description:
      "Sete compromissos com meta, prazo e de onde vem o recurso. Escrito para ser cobrado.",
  },
};

export default function PropostasPage() {
  return <PropostasClient />;
}
