import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";
export const alt = "Arquivo Iceberg — história, pessoas e fontes";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";
export default function Imagem() {
  return cartaoOG({ kicker: "Arquivo documental", titulo: "Arquivo Iceberg", linha: "História, pessoas, conexões e fontes" });
}
