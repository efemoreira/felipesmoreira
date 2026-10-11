import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Cultura — Missão Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Cultura",
    titulo: "Cultura tem valor próprio",
    linha: "Música, cinema, cordel, jogos — da ideia ao grupo permanente",
  });
}
