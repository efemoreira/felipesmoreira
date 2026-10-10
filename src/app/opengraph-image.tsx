import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Missão Ceará — Militância organizada no Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

/* O cartão padrão: vale para toda rota que não tem o seu. */
export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Missão Ceará",
    titulo: "Militância organizada",
    linha: "Núcleos, grupos por tema e porta-vozes no Ceará",
  });
}
