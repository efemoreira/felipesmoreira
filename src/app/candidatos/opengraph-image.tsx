import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Quem disputou pela Missão no Ceará em 2026";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

/* Depois da eleição a página é registro de quem disputou; pedir voto na prévia
   do link desmentiria a própria página. */
export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Eleição 2026",
    titulo: "Quem disputou pela Missão",
    linha: "Os candidatos da Missão no Ceará",
  });
}
