import type { Metadata } from "next";
import PlanoClient from "./PlanoClient";

/* Página interna para a militância — circula por link direto, fora de buscadores */
export const metadata: Metadata = {
  title: "O Plano — Missão Ceará",
  description:
    "Apresentação do plano da Missão Ceará para a militância: como a gente se organiza daqui até outubro.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: null },
  openGraph: {
    title: "O Plano — Missão Ceará",
    description: "De grupo de WhatsApp à militância mais organizada do Ceará.",
  },
};

export default function PlanoPage() {
  return <PlanoClient />;
}
