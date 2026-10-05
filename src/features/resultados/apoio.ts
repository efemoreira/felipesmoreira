import { DADO } from "@/lib/theme";
import { n, type Linha } from "./dados";
import { pct } from "./formato";
import type { LinhaGrupos } from "./graficos";

/** Sufixos de cargo usados nas colunas (`missao_df`, `validos_pres`…). */
export const CARGOS: [string, string][] = [
  ["pres", "Presidente"],
  ["gov", "Governador"],
  ["sen", "Senador"],
  ["df", "Deputado Federal"],
  ["de", "Deputado Estadual"],
];

/** O Missão é sempre um grupo à parte: "Direita" é a direita sem o Missão. */
export const GRUPOS: [string, string, string][] = [
  ["missao", "Missão", DADO.missao],
  ["direita", "Direita", DADO.direita],
  ["centro", "Centro/Centro-Direita", DADO.centro],
  ["esquerda", "Esquerda", DADO.esquerda],
  ["outros", "Não classificado", DADO.outros],
];

export const PORTES = ["Até 10 mil eleitores", "10 a 50 mil", "50 a 200 mil", "200 mil a 1 milhão", "Mais de 1 milhão"];

export function linhasGrupos(l: Linha, cargoDe = (c: string) => c): LinhaGrupos[] {
  return CARGOS.filter(([c]) => n(l, `validos_${c}`) > 0).map(([c, nome]) => ({
    rotulo: cargoDe(nome),
    destaque: `Missão ${Number.isFinite(n(l, `missao_${c}`)) && n(l, `missao_${c}`) > 0 ? pct(n(l, `missao_${c}`) / n(l, `validos_${c}`), 2) : "—"}`,
    fatias: GRUPOS.map(([g, nome, cor]) => ({ nome, cor, valor: n(l, `${g}_${c}`) || 0 })),
  }));
}

/** Indicadores dos mapas: coluna de %, coluna do total e a unidade do total. */
export const INDICADORES: Record<string, { pct: string; total: string; unidade: string }> = {
  Renan: { pct: "pct_missao_pres", total: "missao_pres", unidade: "votos" },
  "Missão Dep. Federal": { pct: "pct_missao_df", total: "missao_df", unidade: "votos" },
  "Missão Dep. Estadual": { pct: "pct_missao_de", total: "missao_de", unidade: "votos" },
  "Aproveitamento Renan → DF": { pct: "aproveitamento_df", total: "missao_df", unidade: "votos DF" },
  "Direita sem Missão (DF)": { pct: "pct_direita_df", total: "direita_df", unidade: "votos" },
  Comparecimento: { pct: "pct_comparecimento", total: "comparecimento", unidade: "eleitores" },
};

/** Percentual que falta calcular no cliente (o export não guarda toda razão). */
export function pctDe(l: Linha, coluna: string): number {
  const direto = n(l, coluna);
  if (Number.isFinite(direto)) return direto;
  const m = coluna.match(/^pct_(\w+)_(pres|gov|sen|df|de)$/);
  return m ? n(l, `${m[1]}_${m[2]}`) / n(l, `validos_${m[2]}`) : NaN;
}
