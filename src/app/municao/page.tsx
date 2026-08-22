import type { Metadata } from "next";
import KitClient from "@/features/kit/KitClient";

/* Ferramenta da militância, não peça de captação: circula por link no grupo,
   e um kit indexado só serviria para o adversário saber o que vem antes. */
export const metadata: Metadata = {
  title: "Kit de compartilhamento",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: null },
};

export default function KitPage() {
  return <KitClient />;
}
