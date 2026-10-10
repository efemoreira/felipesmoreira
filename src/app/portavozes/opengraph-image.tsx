import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Liga dos Porta-vozes — Missão Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Liga dos Porta-vozes",
    titulo: "Quem fala pela Missão",
    linha: "Cinco níveis: cresce nas redes e faz ação real",
  });
}
