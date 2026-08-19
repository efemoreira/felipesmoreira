/**
 * Paleta e presets do estúdio — as cores da marca vêm de lib/theme.ts
 * para não existirem dois "ouro" diferentes no projeto.
 */
import { C } from "@/lib/theme";
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
  /* as de fora da marca: entram como acento, não como base da arte */
  ferrugem: "#8A3B12",
  terra: "#5A4632",
  oliva: "#4A5133",
  petroleo: "#123A44",
  marinho: "#122A4A",
  ameixa: "#3C1F3E",
  cinza: "#6B6B6B",
  prata: "#C8CBD0",
};

/**
 * Atalhos de cor do seletor — o que aparece em quase toda arte.
 *
 * A ordem importa: as da marca vêm primeiro, e é por elas que a mão passa. As
 * de acento ficam depois, para tingir silhueta, dissolver e tarja sem ter de
 * abrir o seletor do sistema e caçar um hexadecimal.
 */
export const ATALHOS_COR: { cor: string; nome: string }[] = [
  { cor: CORES.ouro, nome: "Ouro" },
  { cor: CORES.branco, nome: "Branco" },
  { cor: CORES.preto, nome: "Preto" },
  { cor: CORES.noite, nome: "Noite" },
  { cor: CORES.carvao, nome: "Carvão" },
  { cor: CORES.ouroEscuro, nome: "Ouro escuro" },
  { cor: CORES.creme, nome: "Creme" },
  { cor: CORES.papel, nome: "Papel" },
  { cor: CORES.sangue, nome: "Vermelho" },
  { cor: CORES.ferrugem, nome: "Ferrugem" },
  { cor: CORES.terra, nome: "Terra" },
  { cor: CORES.oliva, nome: "Oliva" },
  { cor: CORES.petroleo, nome: "Petróleo" },
  { cor: CORES.marinho, nome: "Marinho" },
  { cor: CORES.ameixa, nome: "Ameixa" },
  { cor: CORES.cinza, nome: "Cinza" },
  { cor: CORES.prata, nome: "Prata" },
];

/** Cores prontas para a silhueta das pessoas. */
export const TINTAS: { cor: string; nome: string }[] = [
  { cor: CORES.preto, nome: "Preto" },
  { cor: CORES.noite, nome: "Noite" },
  { cor: CORES.ouro, nome: "Ouro" },
  { cor: CORES.branco, nome: "Branco" },
  { cor: CORES.ouroEscuro, nome: "Ouro escuro" },
  { cor: CORES.sangue, nome: "Vermelho" },
  { cor: CORES.ferrugem, nome: "Ferrugem" },
  { cor: CORES.petroleo, nome: "Petróleo" },
  { cor: CORES.prata, nome: "Prata" },
];

/**
 * A estante de fontes do estúdio.
 *
 * A `variavel` é o que vale: o canvas não entende `var(--font-x)`, então o
 * `familia()` (src/lib/fontes.ts) sonda a variável no DOM e devolve o nome real
 * da família. A `reserva` é o que o navegador usa enquanto a fonte não chegou —
 * por isso ela é sempre do mesmo feitio, para o texto não pular de tamanho.
 *
 * Anton, Oswald, Bebas, Archivo, Playfair e a gótica são carregadas na página do
 * estúdio; Alfa Slab, Bitter e Special Elite já vêm do layout do site.
 */
export const FONTES: Record<ChaveFonte, { rotulo: string; variavel: string; reserva: string }> = {
  anton: { rotulo: "Anton — título", variavel: "--font-anton", reserva: "Impact, sans-serif" },
  bebas: { rotulo: "Bebas Neue — título estreito", variavel: "--font-bebas", reserva: "Impact, sans-serif" },
  archivo: { rotulo: "Archivo Black — título pesado", variavel: "--font-archivo", reserva: "Arial Black, sans-serif" },
  oswald: { rotulo: "Oswald — apoio", variavel: "--font-oswald", reserva: "Arial Narrow, sans-serif" },
  alfa: { rotulo: "Alfa Slab — cordel", variavel: "--font-alfa", reserva: "serif" },
  playfair: { rotulo: "Playfair — manchete serifada", variavel: "--font-playfair", reserva: "Georgia, serif" },
  bitter: { rotulo: "Bitter — corrido", variavel: "--font-bitter", reserva: "Georgia, serif" },
  elite: { rotulo: "Special Elite — máquina de escrever", variavel: "--font-elite", reserva: "Courier New, monospace" },
  gotica: { rotulo: "Gótica — jornal antigo", variavel: "--font-gotica", reserva: "serif" },
};

/** Gradientes de fundo prontos. */
export const FUNDOS: { nome: string; cor: string; cor2: string; angulo: number }[] = [
  { nome: "Noite", cor: "#241F16", cor2: CORES.noite, angulo: 0 },
  { nome: "Carvão", cor: "#2A2A2A", cor2: "#0B0B0B", angulo: 0 },
  { nome: "Brasa", cor: "#3A2A08", cor2: CORES.noite, angulo: 0 },
  { nome: "Ouro velho", cor: CORES.ouroEscuro, cor2: CORES.noite, angulo: 25 },
];
