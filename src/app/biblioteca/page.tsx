import type { Metadata } from "next";
import Biblioteca from "@/features/organizacao/Biblioteca";

export const metadata: Metadata = {
  title: "Biblioteca",
  description: "Livro Amarelo, cadernos, diagnósticos e gravações da militância da Missão Ceará — para estudar e levar ao seu núcleo.",
  alternates: { canonical: "https://felipesmoreira.com/biblioteca" },
  openGraph: { title: "Biblioteca — Missão Ceará", description: "Livro Amarelo, cadernos, diagnósticos e gravações da militância." },
  /* O X não herda do openGraph: sem isto o cartão dele mostra o título da raiz. */
  twitter: { title: "Biblioteca — Missão Ceará", description: "Livro Amarelo, cadernos, diagnósticos e gravações da militância." },
};

export default function Pagina() {
  return <Biblioteca />;
}
