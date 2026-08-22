import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "A Missão — Felipe Moreira";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "A Missão",
    titulo: "Primeiro retomar",
    linha: "De militante de internet a candidato a Vice-Governador",
  });
}
