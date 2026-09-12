import type { Metadata } from "next";
import Funcoes from "@/features/funcoes/Funcoes";
import catalogo from "@/data/funcoes.json";

/* O número e os nomes saem do catálogo, não de uma frase escrita à mão: a frase
   dizia "12" desde antes de o catálogo chegar a 17, e a própria página
   imprimia o total certo logo abaixo. */
const nomes = catalogo.funcoes.map((f) => f.nome);

export const metadata: Metadata = {
  title: "O que dá pra fazer na militância",
  description: `As ${nomes.length} funções da militância da Missão Ceará: ${nomes.join(", ")}. O que cada uma entrega e quanto tempo pede.`,
  alternates: { canonical: "https://felipesmoreira.com/funcoes" },
  openGraph: {
    title: "O que dá pra fazer na militância — Missão Ceará",
    description:
      "Cada função diz o que você entrega e quanto tempo pede, antes de você decidir. Tem lugar pra quem tem dez horas por semana e pra quem tem trinta minutos.",
  },
  /* O X não herda do openGraph: sem isto o cartão dele mostra o título da raiz. */
  twitter: {
    title: "O que dá pra fazer na militância — Missão Ceará",
    description:
      "Cada função diz o que você entrega e quanto tempo pede, antes de você decidir. Tem lugar pra quem tem dez horas por semana e pra quem tem trinta minutos.",
  },
};

export default function FuncoesPage() {
  return <Funcoes />;
}
