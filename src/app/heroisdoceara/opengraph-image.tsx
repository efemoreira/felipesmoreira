import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Heróis do Ceará — cordel dos que fizeram nossa história";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Heróis do Ceará",
    titulo: "Quem fez nossa história",
    linha: "Um cordel: da fundação do Ceará à cultura que o mundo conhece",
  });
}
