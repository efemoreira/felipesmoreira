import type { Metadata } from "next";
import PresencaClient from "@/features/presenca/PresencaClient";

/* Página de mesa de evento — chega por QR, nunca por busca. Fora de buscadores
   porque um link de presença indexado só serviria para cadastrar quem não veio.

   O QUE ESTÁ AQUI É O PLANO B. O site é exportado estático: existe um
   `presenca.html` só para todos os encontros, e o robô que monta o cartão do
   link no WhatsApp não roda JS — daqui ele nunca teria como saber QUAL
   encontro. Quem responde com o dia e o nome do encontro é
   `public/painel/api/presenca-previa.php`, para onde o .htaccess desvia o robô.
   Estes valores são o que sobra quando o link chega sem token, ou quando o
   robô que pediu não está na lista de lá. Sem eles o cartão herdava o do
   layout raiz e a mensagem anunciava a candidatura no lugar do encontro. */
export const metadata: Metadata = {
  title: "Presença",
  description:
    "Confirme sua presença ou faça o check-in no encontro da Missão Ceará.",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  openGraph: {
    title: "Presença no encontro",
    description:
      "Confirme sua presença ou faça o check-in no encontro da Missão Ceará.",
  },
  twitter: {
    title: "Presença no encontro",
    description:
      "Confirme sua presença ou faça o check-in no encontro da Missão Ceará.",
  },
};

export default function PresencaPage() {
  return <PresencaClient />;
}
