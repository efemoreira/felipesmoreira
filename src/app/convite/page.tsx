import type { Metadata } from "next";
import ConviteClient from "@/features/convite/ConviteClient";

/* Chega por link no WhatsApp, nunca por busca — e cada link é de UMA pessoa
   para UMA peça de UM encontro. Fora de buscadores pelo mesmo motivo da
   presença: um convite indexado não serve a ninguém, e aqui ele nem funcionaria
   sem o token que vem na URL.

   Sem cartão de prévia próprio, ao contrário da /presenca: o link não circula
   em grupo, vai de uma pessoa para outra junto de uma mensagem que já diz tudo
   — quem manda escreve "posso te escalar como Recepção?" e os itens vêm no
   corpo. Um cartão genérico ao lado disso seria ruído. */
export const metadata: Metadata = {
  title: "Seu convite",
  description: "Responda se você pode assumir a peça no encontro da Missão Ceará.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function ConvitePage() {
  return <ConviteClient />;
}
