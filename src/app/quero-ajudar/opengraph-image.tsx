import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Entre pra militância da Missão Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Quero ajudar",
    titulo: "Entre pro movimento",
    linha: "Escolha sua função e a coordenação entra em contato",
  });
}
