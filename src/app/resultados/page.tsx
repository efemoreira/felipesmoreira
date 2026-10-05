import type { Metadata } from "next";
import ResultadosClient from "@/features/resultados/ResultadosClient";

/* Estudo interno do resultado de 2026: circula por link entre a coordenação,
   como a Munição. Os números são públicos (TSE), mas as ideias e os pontos
   fracos por estado não são vitrine — nada de índice nem de sitemap. */
export const metadata: Metadata = {
  title: "Resultados 2026",
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: null },
};

export default function ResultadosPage() {
  return <ResultadosClient />;
}
