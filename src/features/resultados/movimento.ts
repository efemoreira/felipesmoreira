/**
 * O movimento antes do partido: quem já disputava voto pelo MBL quando o
 * Missão ainda não existia (2022 e 2024 saíram por outras legendas).
 *
 * O export de /resultados só tem candidato de 2026 (e o histórico de 2022/2024
 * de quem teve voto em 2022 ou 2026, em `adversarios/<uf>.json`). Quem só
 * concorreu em 2024 — o Pedro Arthur, que não tinha idade para deputado em
 * 2026 — não aparece em lugar nenhum dele; o número de 2024 fica aqui, com a
 * fonte. O voto por bairro, quando existir, é gerado por
 * `scripts/votos-por-bairro.mjs` a partir da votação por seção do TSE e vira
 * `public/resultados-2026/movimento/<arquivo>.json`.
 */

export type Ano = {
  ano: number;
  cargo: string;
  numero: string;
  partido: string;
  votos: number;
  situacao: string;
  /** onde: a UF (deputado) ou a cidade (vereador) */
  onde: string;
  fonte?: string;
};

export type NomeDoMovimento = {
  /** candidato_sq de 2026 (casa com `resumo.candidatos` e `adversarios/<uf>.json`); vazio = não concorreu em 2026 */
  sq2026?: string;
  /** id = chave na URL e no seletor */
  id: string;
  nome: string;
  uf: string;
  /** cidade-base (código do TSE, o mesmo de `uf/<uf>.json`) */
  cidade: string;
  /** anos que o export não traz (2024 de quem não teve voto em 2022/2026) */
  historico: Ano[];
  /** por que não concorreu em 2026, quando não concorreu */
  fora2026?: string;
  /** o que vem: a próxima disputa; `vereador` liga a régua de 2028 na cidade-base */
  proxima: { ano: number; cargo: string; onde: string; vereador?: boolean };
  /** votos por bairro gerados pelo script (arquivo em `movimento/`), por ano */
  bairros?: { ano: number; arquivo: string; rotulo: string }[];
};

export const NOMES_DO_MOVIMENTO: NomeDoMovimento[] = [
  {
    id: "kim",
    sq2026: "250002546642",
    nome: "Kim Kataguiri",
    uf: "sp",
    cidade: "71072",
    historico: [],
    proxima: { ano: 2030, cargo: "Deputado Federal (reeleição) ou majoritária", onde: "SP" },
  },
  {
    id: "guto",
    sq2026: "250002546631",
    nome: "Guto Zacarias",
    uf: "sp",
    cidade: "71072",
    historico: [],
    proxima: { ano: 2028, cargo: "Vereador ou apoio à chapa", onde: "São Paulo", vereador: true },
    bairros: [{ ano: 2022, arquivo: "sp-71072-2022-44777", rotulo: "Dep. Estadual 2022 (44777)" }],
  },
  {
    id: "pedro",
    nome: "Pedro Arthur",
    uf: "ce",
    cidade: "13897",
    historico: [
      {
        ano: 2024,
        cargo: "Vereador",
        numero: "44999",
        partido: "UNIÃO",
        votos: 2861,
        situacao: "Não eleito (131º em Fortaleza)",
        onde: "Fortaleza",
        fonte: "Resultado do TSE de vereador em Fortaleza 2024, como publicado pela imprensa (O Tempo). O script por seção confere o total.",
      },
    ],
    fora2026: "Nascido em 03/10/2006: teria 20 anos na posse de 2027, e deputado exige 21. Por isso ficou fora de 2026.",
    proxima: { ano: 2028, cargo: "Vereador (chapa do Missão)", onde: "Fortaleza", vereador: true },
    bairros: [{ ano: 2024, arquivo: "ce-13897-2024-44999", rotulo: "Vereador 2024 (44999)" }],
  },
];

/** O mínimo individual: o candidato precisa de 10% do QE em voto nominal para assumir. */
export const MINIMO_INDIVIDUAL = 0.1;
/** O partido precisa de 80% do QE para disputar as sobras. */
export const BARREIRA_SOBRAS = 0.8;

/** Votos por bairro de um nome do movimento num ano (saída do script). */
export type VotosPorBairro = {
  ano: number;
  uf: string;
  municipio: string;
  cargo: string;
  numero: string;
  fonte: string;
  total: number;
  /** votos em local que não casou com o cadastro de 2026 */
  semBairro: number;
  bairros: { bairro_chave: string; votos: number }[];
};

/** Correlação de Pearson; NaN com menos de 3 pares. */
export function correlacao(x: number[], y: number[]): number {
  const pares = x.map((a, i) => [a, y[i]]).filter(([a, b]) => Number.isFinite(a) && Number.isFinite(b));
  if (pares.length < 3) return NaN;
  const m = (k: 0 | 1) => pares.reduce((s, p) => s + p[k], 0) / pares.length;
  const mx = m(0);
  const my = m(1);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const [a, b] of pares) {
    sxy += (a - mx) * (b - my);
    sxx += (a - mx) ** 2;
    syy += (b - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : NaN;
}
