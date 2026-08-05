/**
 * Paleta e presets do estúdio — as cores da marca vêm de programacao/tipos.ts
 * para não existirem dois "ouro" diferentes no projeto.
 */
import { C } from "../../programacao/tipos";
import type { ChaveFonte } from "./tipos";

export const CORES = {
  ouro: C.gold,
  ouroEscuro: C.goldDim,
  noite: C.night,
  tinta: C.ink,
  creme: C.cream,
  papel: C.paper,
  branco: "#FFFFFF",
  preto: "#000000",
  carvao: "#1E1B16",
  sangue: "#B3261E",
};

/** Atalhos de cor do seletor — o que aparece em quase toda arte. */
export const ATALHOS_COR: { cor: string; nome: string }[] = [
  { cor: CORES.ouro, nome: "Ouro" },
  { cor: CORES.branco, nome: "Branco" },
  { cor: CORES.preto, nome: "Preto" },
  { cor: CORES.noite, nome: "Noite" },
  { cor: CORES.carvao, nome: "Carvão" },
  { cor: CORES.ouroEscuro, nome: "Ouro escuro" },
  { cor: CORES.creme, nome: "Creme" },
  { cor: CORES.sangue, nome: "Vermelho" },
];

/** Cores prontas para a silhueta das pessoas. */
export const TINTAS: { cor: string; nome: string }[] = [
  { cor: CORES.preto, nome: "Preto" },
  { cor: CORES.noite, nome: "Noite" },
  { cor: CORES.ouro, nome: "Ouro" },
  { cor: CORES.branco, nome: "Branco" },
  { cor: CORES.ouroEscuro, nome: "Ouro escuro" },
  { cor: CORES.sangue, nome: "Vermelho" },
];

export const FONTES: Record<ChaveFonte, { rotulo: string; variavel: string; reserva: string }> = {
  anton: { rotulo: "Anton — títulos", variavel: "--font-anton", reserva: "Impact, sans-serif" },
  oswald: { rotulo: "Oswald — apoio", variavel: "--font-oswald", reserva: "Arial Narrow, sans-serif" },
  alfa: { rotulo: "Alfa Slab — cordel", variavel: "--font-alfa", reserva: "serif" },
  bitter: { rotulo: "Bitter — corrido", variavel: "--font-bitter", reserva: "Georgia, serif" },
};

/** Gradientes de fundo prontos. */
export const FUNDOS: { nome: string; cor: string; cor2: string; angulo: number }[] = [
  { nome: "Noite", cor: "#241F16", cor2: CORES.noite, angulo: 0 },
  { nome: "Carvão", cor: "#2A2A2A", cor2: "#0B0B0B", angulo: 0 },
  { nome: "Brasa", cor: "#3A2A08", cor2: CORES.noite, angulo: 0 },
  { nome: "Ouro velho", cor: CORES.ouroEscuro, cor2: CORES.noite, angulo: 25 },
];
