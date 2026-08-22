import type { Metadata } from "next";
import Missao from "@/features/missao/Missao";

export const metadata: Metadata = {
  title: "A Missão",
  description:
    "Quem é Felipe Moreira, candidato a Vice-Governador do Ceará: de militante de internet no MBL a militante de rua, e por que segurança pública é o eixo da candidatura.",
  alternates: { canonical: "https://felipesmoreira.com/amissao" },
  openGraph: {
    title: "A Missão — Felipe Moreira",
    description:
      "De militante de internet a candidato a Vice-Governador. O caminho passou por uma sala de jovens na igreja.",
  },
};

export default function AMissaoPage() {
  return <Missao />;
}
