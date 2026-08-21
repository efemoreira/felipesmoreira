import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Retomar para Reconstruir — o plano de governo";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Plano de governo",
    titulo: "Retomar para Reconstruir",
    linha: "Sete compromissos com meta, prazo e de onde vem o recurso",
  });
}
