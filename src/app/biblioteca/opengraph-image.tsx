import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Biblioteca — Missão Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Biblioteca",
    titulo: "Para estudar e levar ao núcleo",
    linha: "Livro Amarelo, cadernos, diagnósticos e gravações",
  });
}
