import type { Metadata } from "next";
import PresencaClient from "@/features/presenca/PresencaClient";

/* Página de mesa de evento — chega por QR, nunca por busca. Fora de buscadores
   porque um link de presença indexado só serviria para cadastrar quem não veio. */
export const metadata: Metadata = {
  title: "Presença",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
};

export default function PresencaPage() {
  return <PresencaClient />;
}
