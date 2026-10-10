import type { Metadata } from "next";
import Temas from "@/features/organizacao/Temas";

export const metadata: Metadata = {
  title: "Grupos temáticos",
  description: "Um tema, um grupo: segurança, educação, saúde, economia e mais — cada grupo com três portas (estudo, profissionais, movimento).",
  alternates: { canonical: "https://felipesmoreira.com/temas" },
  openGraph: { title: "Grupos temáticos — Missão Ceará", description: "Um tema, um grupo: segurança, educação, saúde, economia e mais — cada grupo com três portas (estudo, profissionais, movimento)." },
  /* O X não herda do openGraph: sem isto o cartão dele mostra o título da raiz. */
  twitter: { title: "Grupos temáticos — Missão Ceará", description: "Um tema, um grupo: segurança, educação, saúde, economia e mais — cada grupo com três portas (estudo, profissionais, movimento)." },
};

export default function Pagina() {
  return <Temas />;
}
