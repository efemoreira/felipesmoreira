import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Felipe Moreira — Candidato a Vice-Governador do Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

/* O cartão padrão: vale para toda rota que não tem o seu. */
export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Missão Ceará",
    titulo: "Felipe Moreira",
    linha: "Candidato a Vice-Governador do Ceará",
  });
}
