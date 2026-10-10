import type { Metadata } from "next";
import Missao from "@/features/missao/Missao";

export const metadata: Metadata = {
  title: "A Missão",
  description:
    "Quem é Felipe Moreira, coordenador de militância da Missão Ceará: de militante de internet no MBL a militante de rua, candidato a Vice-Governador em 2026, e por que segurança pública é o eixo.",
  alternates: { canonical: "https://felipesmoreira.com/amissao" },
  openGraph: {
    title: "A Missão — Felipe Moreira",
    description:
      "De militante de internet a candidato, e daí a coordenar a militância. O caminho passou por uma sala de jovens na igreja.",
  },
  /* O X não herda do openGraph: sem isto o cartão dele mostra o título da raiz. */
  twitter: {
    title: "A Missão — Felipe Moreira",
    description:
      "De militante de internet a candidato, e daí a coordenar a militância. O caminho passou por uma sala de jovens na igreja.",
  },
};

export default function AMissaoPage() {
  return <Missao />;
}
