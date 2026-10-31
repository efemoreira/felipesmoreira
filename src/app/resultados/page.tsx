import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { resumirVereadores } from "@/features/resultados/vereadores";
import type { Linha } from "@/features/resultados/dados";
import type { Metadata } from "next";
import ResultadosClient from "@/features/resultados/ResultadosClient";

/* Estudo interno do resultado de 2026: circula por link entre a coordenação,
   como a Munição. Os números são públicos (TSE), mas a leitura dos adversários e os pontos
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
  // Calculado na geração estática: o navegador recebe só os totais do país.
  const pasta = path.join(process.cwd(), "public/resultados-2026/uf");
  const cidades = readdirSync(pasta)
    .filter((arquivo) => /^[a-z]{2}\.json$/.test(arquivo) && !["df.json", "zz.json"].includes(arquivo))
    .flatMap((arquivo) => {
      const { cidades } = JSON.parse(readFileSync(path.join(pasta, arquivo), "utf8")) as { cidades: { colunas: string[]; linhas: (string | number | boolean | null)[][] } };
      return cidades.linhas.map((linha) => Object.fromEntries(cidades.colunas.map((coluna, i) => [coluna, linha[i] ?? undefined])) as Linha);
    });
  return <ResultadosClient vereadoresBrasil={resumirVereadores(cidades)} />;
}
