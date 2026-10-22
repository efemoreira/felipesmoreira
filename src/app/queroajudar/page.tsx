import type { Metadata } from "next";
import InscricaoClient from "@/features/inscricao/InscricaoClient";

/* O título de compartilhamento é o convite, não o cargo. Este link circula
   colado numa mensagem de WhatsApp, e quem o recebe já sabe de quem é — o que
   ele precisa ler é o que se espera dele. `twitter` repetido de propósito: sem
   ele o cartão do X cai no do layout raiz e volta a anunciar a candidatura. */
export const metadata: Metadata = {
  title: "Vamos construir juntos",
  description:
    "Ajude a construir a Missão Ceará. Informe sua cidade e bairro e, se quiser, trabalho, estudo, interesses e disponibilidade para formar núcleos, grupos e atividades.",
  alternates: { canonical: "https://felipesmoreira.com/queroajudar" },
  openGraph: {
    title: "Ajude a Missão",
    description:
      "Escolha por onde começar na militância da Missão Ceará. Tem lugar pra quem tem dez horas por semana e pra quem tem trinta minutos.",
  },
  twitter: {
    title: "Ajude a Missão",
    description:
      "Escolha por onde começar na militância da Missão Ceará. Tem lugar pra quem tem dez horas por semana e pra quem tem trinta minutos.",
  },
};

export default function QueroAjudarPage() {
  return <InscricaoClient />;
}
