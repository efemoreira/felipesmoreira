import type { Metadata } from "next";
import Acao from "@/features/acao/Acao";

export const metadata: Metadata = {
  title: "Ação — Central privada",
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } },
  alternates: { canonical: null },
};

/** O export contém somente a interface. O acervo vem da API exclusiva do dono. */
export default function AcaoPage() {
  return <Acao />;
}
