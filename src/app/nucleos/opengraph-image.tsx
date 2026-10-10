import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Núcleos — Missão Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Núcleos",
    titulo: "A Missão no seu bairro",
    linha: "Onde a militância se encontra, com ritmo certo e alguém que responde",
  });
}
