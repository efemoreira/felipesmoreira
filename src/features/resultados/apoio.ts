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

/* ---------- bairros e adversários ---------- */

/**
 * "Pende para" em palavras. O valor vem do export: (Missão + Direita − Esquerda) ÷ válidos,
 * de −1 a +1. O relativo (`lado_rel_*`) é o mesmo número menos o do estado.
 */
export function ladoTexto(x: number, relativo = false): string {
  if (!Number.isFinite(x)) return "—";
  if (relativo) {
    if (x >= 0.1) return "Bem mais à direita que o estado";
    if (x >= 0.03) return "Mais à direita que o estado";
    if (x > -0.03) return "Na média do estado";
    if (x > -0.1) return "Mais à esquerda que o estado";
    return "Bem mais à esquerda que o estado";
  }
  if (x >= 0.25) return "Direita forte";
  if (x >= 0.08) return "Pende à direita";
  if (x > -0.08) return "Dividido";
  if (x > -0.25) return "Pende à esquerda";
  return "Esquerda forte";
}

/** −0,12 → "−12 pts" (pontos na escala de −100 a +100, que é como se lê o "pende para"). */
export const pontos = (x: number) => (Number.isFinite(x) ? `${x > 0 ? "+" : x < 0 ? "−" : ""}${Math.abs(Math.round(x * 100))} pts` : "—");

/** Barras dos três anos lado a lado, para o mesmo lugar. */
export const CARGOS_TEMPO: [string, string][] = [
  ["pres", "Presidente 2026"],
  ["pres_22", "Presidente 2022"],
  ["gov", "Governador 2026"],
  ["df", "Dep. Federal 2026"],
  ["df_22", "Dep. Federal 2022"],
  ["de", "Dep. Estadual 2026"],
  ["de_22", "Dep. Estadual 2022"],
  ["pref_24", "Prefeito 2024"],
  ["ver_24", "Vereador 2024"],
];

export function linhasTempo(l: Linha): LinhaGrupos[] {
  return CARGOS_TEMPO.filter(([c]) => n(l, `validos_${c}`) > 0).map(([c, nome]) => {
    const outros = n(l, `validos_${c}`) - GRUPOS.slice(0, 4).reduce((s, [g]) => s + (n(l, `${g}_${c}`) || 0), 0);
    return {
      rotulo: nome,
      destaque: n(l, `missao_${c}`) > 0 ? `Missão ${pct(n(l, `missao_${c}`) / n(l, `validos_${c}`), 2)}` : undefined,
      fatias: GRUPOS.map(([g, nomeG, cor]) => ({ nome: nomeG, cor, valor: g === "outros" ? Math.max(0, outros) : n(l, `${g}_${c}`) || 0 })),
    };
  });
}

export const NOME_CARGO: Record<string, string> = {
  pres: "Presidente",
  gov: "Governador",
  sen: "Senador",
  df: "Dep. Federal",
  de: "Dep. Estadual",
  pref: "Prefeito",
  ver: "Vereador",
};

export const NOME_ORIGEM: Record<string, string> = {
  ibge: "IBGE",
  "ibge-nome": "IBGE (pelo nome)",
  distrito: "Distrito (IBGE)",
  cartorio: "Cartório",
  sem: "Sem bairro",
};

/** Link do Google Maps para um local de votação (lat/long vêm ×100.000 do export). */
export const linkMapa = (l: Linha) => {
  const lat = n(l, "lat5") / 1e5;
  const lon = n(l, "lon5") / 1e5;
  return Number.isFinite(lat) && Number.isFinite(lon) ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}` : "";
};
