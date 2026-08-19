import type { Metadata } from "next";
import HeroisClient from "@/features/herois/HeroisClient";

export const metadata: Metadata = {
  title: "Heróis do Ceará",
  description:
    "Cordel dos que fizeram nossa história: conheça os heróis históricos do Ceará, suas histórias, legados e impactos na formação cultural do estado.",
  alternates: { canonical: "https://felipesmoreira.com/herois-do-ceara" },
  openGraph: {
    title: "Heróis do Ceará — Missão Ceará",
    description:
      "Cordel dos que fizeram nossa história: da fundação do Ceará à cultura que o mundo conhece.",
  },
};

export default function HeroisDoCearaPage() {
  return <HeroisClient />;
}
