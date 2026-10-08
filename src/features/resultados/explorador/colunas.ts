import { n, t } from "../dados";
import { pctDe, pontos } from "../apoio";
import type { Coluna } from "../pecas";

/**
 * As colunas das tabelas do Explorador. `COLUNAS_*` são as completas — as
 * mesmas que as abas Brasil, Estado e Bairros tinham — e ficam atrás do botão
 * "Mais colunas". As enxutas são o que a tabela abre mostrando.
 * `explorador.test.ts` prende que nenhuma coluna antiga sumiu.
 */

export const COLUNAS_UF: Coluna[] = [
  { chave: "nome", rotulo: "Estado", tipo: "txt" },
  { chave: "eleitorado", rotulo: "Eleitorado" },
  { chave: "pct_comparecimento", rotulo: "Comparec.", tipo: "pct" },
  { chave: "missao_pres", rotulo: "Renan" },
  { chave: "pct_missao_pres", rotulo: "Renan %", tipo: "pct" },
  { chave: "missao_df", rotulo: "Missão DF" },
  { chave: "pct_missao_df", rotulo: "DF %", tipo: "pct" },
  { chave: "missao_de", rotulo: "Missão DE" },
  { chave: "pct_missao_de", rotulo: "DE %", tipo: "pct" },
  { chave: "aproveitamento_df", rotulo: "Renan → DF", tipo: "barra", max: 1 },
  { chave: "vagas_df", rotulo: "Vagas DF" },
  { chave: "qe_df", rotulo: "QE DF" },
  { chave: "qe_atingidos_df", rotulo: "QE atingidos DF", tipo: "dec" },
  { chave: "eleitos_df", rotulo: "Eleitos DF" },
];

export const COLUNAS_REGIAO: Coluna[] = [{ ...COLUNAS_UF[0], rotulo: "Região" }, ...COLUNAS_UF.slice(1).filter((c) => !["qe_df", "qe_atingidos_df"].includes(c.chave))];

export const COLUNAS_CIDADE: Coluna[] = [
  { chave: "nome", rotulo: "Município", tipo: "txt" },
  { chave: "porte", rotulo: "Porte", tipo: "txt" },
  { chave: "eleitorado", rotulo: "Eleitorado" },
  { chave: "pct_comparecimento", rotulo: "Comparec.", tipo: "pct" },
  { chave: "missao_pres", rotulo: "Renan" },
  { chave: "pct_missao_pres", rotulo: "Renan %", tipo: "pct", valor: (l) => pctDe(l, "pct_missao_pres") },
  { chave: "missao_df", rotulo: "Missão DF" },
  { chave: "pct_missao_df", rotulo: "DF %", tipo: "pct", valor: (l) => pctDe(l, "pct_missao_df") },
  { chave: "missao_de", rotulo: "Missão DE" },
  { chave: "pct_missao_de", rotulo: "DE %", tipo: "pct", valor: (l) => pctDe(l, "pct_missao_de") },
  { chave: "missao_leg_df", rotulo: "Legenda DF" },
  { chave: "aproveitamento_df", rotulo: "Renan → DF", tipo: "barra", max: 1 },
  { chave: "indice_forca_df", rotulo: "Força DF", tipo: "dec", ajuda: "% do Missão na cidade ÷ % no estado (1,00 = média)" },
  { chave: "pct_direita_df", rotulo: "Direita DF %", tipo: "pct", valor: (l) => pctDe(l, "pct_direita_df") },
  { chave: "pct_esquerda_df", rotulo: "Esquerda DF %", tipo: "pct", valor: (l) => pctDe(l, "pct_esquerda_df") },
  { chave: "vagas_ver", rotulo: "Vagas vereador" },
  { chave: "qe_ver_2028_est", rotulo: "QE vereador 2028" },
  { chave: "situacao_vereador", rotulo: "Vereador", tipo: "txt" },
];

export const COLUNAS_BAIRRO: Coluna[] = [
  { chave: "nome", rotulo: "Bairro", tipo: "txt" },
  { chave: "eleitorado", rotulo: "Eleitores" },
  { chave: "pct_comp", rotulo: "Compareceu", tipo: "pct" },
  { chave: "lado_txt", rotulo: "Pende para", tipo: "txt", valor: (l) => `${t(l, "lado_txt")} (${pontos(n(l, "lado_pres"))})` },
  { chave: "lado_rel_pres", rotulo: "vs. estado", valor: (l) => n(l, "lado_rel_pres") * 100, tipo: "dec", ajuda: "pontos acima (+) ou abaixo (−) do estado" },
  { chave: "var_lado_pres", rotulo: "Andou 22→26", valor: (l) => n(l, "var_lado_pres") * 100, tipo: "dec", ajuda: "pontos para a direita (+) desde 2022" },
  { chave: "pct_renan", rotulo: "Renan", tipo: "pct" },
  { chave: "pct_mdf", rotulo: "Missão DF", tipo: "pct" },
  { chave: "aproveitamento_df", rotulo: "Renan → DF", tipo: "pct" },
  { chave: "pct_dir_de", rotulo: "Direita DE", tipo: "pct" },
  { chave: "oportunidade", rotulo: "Oportunidade" },
  { chave: "missao_em_qe_ver", rotulo: "Missão em QE ver.", tipo: "dec", ajuda: "melhor votação de deputado do Missão no bairro ÷ QE de vereador estimado da cidade" },
  { chave: "origem", rotulo: "Nome vem de", tipo: "txt" },
];

/** As poucas colunas que a tabela abre mostrando, mais a do indicador pintado (`Explorador` acrescenta). */
const ENXUTAS = ["nome", "eleitorado", "missao_pres", "pct_missao_pres", "pct_renan", "missao_df", "pct_missao_df", "pct_mdf", "aproveitamento_df", "situacao_vereador", "oportunidade"];

export const enxutas = (cols: Coluna[]) => cols.filter((c) => ENXUTAS.includes(c.chave));
