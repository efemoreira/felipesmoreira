import type { Metadata } from "next";
import PitchesPage from "@/features/pitch/PitchesPage";

export const metadata: Metadata = {
  title: "Pitches de projetos",
  description:
    "Pitches de projetos de Felipe Moreira: ideias, produtos e soluções em apresentação curta, com problema, modelo de negócio e proposta de valor.",
  alternates: { canonical: "https://felipesmoreira.com/pitch" },
  openGraph: {
    title: "Pitches de projetos",
    description:
      "Ideias e negócios em apresentação curta: Guardião Predial, Fluux, CoopCRM e Meu Frete.",
  },
  twitter: {
    title: "Pitches de projetos",
    description:
      "Ideias e negócios em apresentação curta: Guardião Predial, Fluux, CoopCRM e Meu Frete.",
  },
};

export default function PitchIndexPage() {
  return <PitchesPage />;
}
