import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";
import catalogo from "@/data/funcoes.json";

export const alt = "O que dá pra fazer na militância da Missão Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Militância",
    titulo: "Tem lugar pra você",
    linha: `As ${catalogo.funcoes.length} funções: o que cada uma entrega e quanto tempo pede`,
  });
}
