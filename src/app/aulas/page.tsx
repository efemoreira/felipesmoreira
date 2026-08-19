import type { Metadata } from "next";
import AulasClient from "@/features/aulas/AulasClient";

/* Área de membros — fora de buscadores, acesso checado via sessão do painel */
export const metadata: Metadata = {
  title: "Aulas",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function AulasPage() {
  return <AulasClient />;
}
