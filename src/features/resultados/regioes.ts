import type { Linha } from "./dados";

/**
 * As regiões do IBGE, e o exterior à parte. O export não tem linha de região:
 * ela é a soma das linhas dos estados, e as razões são refeitas a partir das
 * somas — a mesma conta do export para o Brasil (o contrato prende que
 * regiões somadas = Brasil).
 */
export const REGIOES = [
  ["ne", "Nordeste", ["al", "ba", "ce", "ma", "pb", "pe", "pi", "rn", "se"]],
  ["no", "Norte", ["ac", "am", "ap", "pa", "ro", "rr", "to"]],
  ["co", "Centro-Oeste", ["df", "go", "ms", "mt"]],
  ["se", "Sudeste", ["es", "mg", "rj", "sp"]],
  ["su", "Sul", ["pr", "rs", "sc"]],
  ["ex", "Exterior", ["zz"]],
] as const satisfies readonly (readonly [string, string, readonly string[]])[];

export type Regiao = (typeof REGIOES)[number][0];

export const NOME_REGIAO = Object.fromEntries(REGIOES.map(([k, nome]) => [k, nome])) as Record<Regiao, string>;

export const regiaoDe = (uf: string): Regiao => (REGIOES.find(([, , ufs]) => (ufs as readonly string[]).includes(uf))?.[0] ?? "ne") as Regiao;

/**
 * Colunas que não se somam: dependem das vagas de cada estado (quociente,
 * mínimo por candidato, o que faltou para a próxima cadeira…).
 */
const POR_ESTADO = /^(qe_|minimo_individual_|faltam_|qe_atingidos_|renan_em_qe_|eleitores_por_cadeira_)/;
const CARGOS = ["pres", "gov", "sen", "df", "de"];

/** Soma as linhas dos estados e refaz os percentuais. */
export function somarLinhas(linhas: Linha[]): Linha {
  const s: Record<string, number> = {};
  for (const l of linhas)
    for (const [k, x] of Object.entries(l))
      if (typeof x === "number" && !k.startsWith("pct_") && !k.startsWith("aproveitamento_") && !k.startsWith("indice_") && !k.startsWith("leg_por_100_") && !POR_ESTADO.test(k))
        s[k] = (s[k] ?? 0) + x;

  const r: Linha = { ...s };
  const div = (a: number, b: number) => (b > 0 ? a / b : NaN);
  r.pct_comparecimento = div(s.comparecimento, s.eleitorado);
  r.pct_abstencao = div(s.abstencao, s.eleitorado);
  for (const c of CARGOS) {
    for (const g of ["missao", "direita", "centro", "esquerda"]) r[`pct_${g}_${c}`] = div(s[`${g}_${c}`] ?? 0, s[`validos_${c}`]);
    for (const g of ["brancos", "nulos"]) r[`pct_${g}_${c}`] = div(s[`${g}_${c}`] ?? 0, s.comparecimento);
  }
  for (const c of ["df", "de"]) {
    const missao = s[`missao_${c}`] ?? 0;
    const leg = s[`missao_leg_${c}`] ?? 0;
    r[`missao_nom_${c}`] = missao - leg;
    r[`aproveitamento_${c}`] = div(missao, s.missao_pres);
    r[`pct_leg_missao_${c}`] = div(leg, missao);
    r[`pct_leg_geral_${c}`] = div(s[`legenda_${c}`] ?? 0, s[`validos_${c}`]);
    r[`indice_legenda_${c}`] = div(r[`pct_leg_missao_${c}`] as number, r[`pct_leg_geral_${c}`] as number);
    r[`leg_por_100_renan_${c}`] = div(leg * 100, s.missao_pres);
  }
  return r;
}

/** Uma linha por região, com `regiao` (código) e `nome`. */
export function linhasRegioes(ufs: Linha[]): Linha[] {
  return REGIOES.map(([k, nome, lista]) => ({
    ...somarLinhas(ufs.filter((u) => (lista as readonly string[]).includes(String(u.uf)))),
    regiao: k,
    nome,
  }));
}

/** As linhas dos estados de uma região. */
export const ufsDaRegiao = (ufs: Linha[], r: Regiao) => {
  const lista = REGIOES.find(([k]) => k === r)?.[2] as readonly string[] | undefined;
  return ufs.filter((u) => lista?.includes(String(u.uf)));
};
