import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Grupos temáticos — Missão Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Grupos temáticos",
    titulo: "Um tema, um grupo",
    linha: "Três portas: estudo, profissionais e movimento",
  });
}
