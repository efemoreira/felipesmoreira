import { cartaoOG, TAMANHO_OG } from "@/lib/ogCard";

export const alt = "Programação da semana — Missão Ceará";
export const size = TAMANHO_OG;
export const contentType = "image/png";
export const dynamic = "force-static";

/* O cartão é fixo: o export é estático e a semana muda toda semana. O que
   varia (o próximo encontro) o pôster de compartilhar resolve, gerado no
   navegador. Aqui é só dizer do que a página trata. */
export default function OpengraphImage() {
  return cartaoOG({
    kicker: "Programação",
    titulo: "A semana da Missão",
    linha: "Lives, encontros e onde assistir — dia e horário, de domingo a sábado",
  });
}
