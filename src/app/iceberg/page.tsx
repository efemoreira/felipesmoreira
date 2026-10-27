import type { Metadata } from "next";
import ArquivoIceberg from "@/features/iceberg/ArquivoIceberg";

export const metadata: Metadata = {
  title: "Arquivo Iceberg",
  description: "Uma linha do tempo dos Icebergs, dos documentários do MBL e da formação do Missão. Pessoas, episódios, imagens creditadas e fontes para consultar.",
  alternates: { canonical: "https://felipesmoreira.com/iceberg" },
  openGraph: { title: "Arquivo Iceberg — Missão Ceará", description: "Quatro vídeos, uma linha do tempo. Explore os acontecimentos, as pessoas e as fontes." },
  twitter: { title: "Arquivo Iceberg — Missão Ceará", description: "Quatro vídeos, uma linha do tempo. Explore os acontecimentos, as pessoas e as fontes." },
};

export default function Pagina() { return <ArquivoIceberg />; }
