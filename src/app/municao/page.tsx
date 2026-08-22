import type { Metadata } from "next";
import MunicaoClient from "@/features/kit/KitClient";

/* Ferramenta da militância, não peça de captação: circula por link no grupo,
   e uma lista indexada do que vem por aí só serviria ao adversário. */
export const metadata: Metadata = {
  title: "Munição",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: null },
};

export default function MunicaoPage() {
  return <MunicaoClient />;
}
