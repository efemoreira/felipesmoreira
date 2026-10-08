import { n, type Linha } from "../dados";
import { pct } from "../formato";
import { pontos } from "../apoio";

/**
 * O que pintar no mapa, agrupado pela pergunta que responde. `pct` é a fração
 * que colore a área; `votos` é o total que vira círculo (área grande não é
 * muito voto). `filhos` diz em que tipo de área o dado existe — o que não
 * existe aparece apagado, com o motivo, em vez de sumir.
 */

export type TipoFilho = "regiao" | "uf" | "cidade" | "bairro";
export type Pergunta = "forca" | "converter" | "terreno";

export type IndicadorMapa = {
  id: string;
  rotulo: string;
  pergunta: Pergunta;
  pct?: (l: Linha) => number;
  votos?: (l: Linha) => number;
  /** o que o número é, em português, para a caixinha e a ficha */
  unidade: string;
  divergente?: boolean;
  formato: (x: number) => string;
  /** só nestes tipos de área (padrão: todos) */
  so?: TipoFilho[];
  motivo?: string;
};

export const PERGUNTAS: [Pergunta, string][] = [
  ["forca", "Onde o Missão é forte"],
  ["converter", "Onde falta converter"],
  ["terreno", "O terreno"],
];

const razao = (a: number, b: number) => (b > 0 ? a / b : NaN);
const lado = (l: Linha) => (Number.isFinite(n(l, "lado_pres")) ? n(l, "lado_pres") : razao(n(l, "missao_pres") + n(l, "direita_pres") - n(l, "esquerda_pres"), n(l, "validos_pres")));

export const INDICADORES_MAPA: IndicadorMapa[] = [
  { id: "renan", rotulo: "Renan", pergunta: "forca", pct: (l) => razao(n(l, "missao_pres"), n(l, "validos_pres")), votos: (l) => n(l, "missao_pres"), unidade: "dos válidos para Presidente", formato: (x) => pct(x, 2) },
  { id: "df", rotulo: "Missão Dep. Federal", pergunta: "forca", pct: (l) => razao(n(l, "missao_df"), n(l, "validos_df")), votos: (l) => n(l, "missao_df"), unidade: "dos válidos para Dep. Federal", formato: (x) => pct(x, 2) },
  { id: "de", rotulo: "Missão Dep. Estadual", pergunta: "forca", pct: (l) => razao(n(l, "missao_de"), n(l, "validos_de")), votos: (l) => n(l, "missao_de"), unidade: "dos válidos para Dep. Estadual", formato: (x) => pct(x, 2) },
  {
    id: "aproveitamento",
    rotulo: "Do Renan para deputado",
    pergunta: "converter",
    pct: (l) => razao(n(l, "missao_df"), n(l, "missao_pres")),
    votos: (l) => n(l, "missao_df"),
    unidade: "dos votos do Renan foram para Dep. Federal do Missão",
    formato: (x) => pct(x, 0),
  },
  {
    id: "naoveio",
    rotulo: "Renan que não veio",
    pergunta: "converter",
    pct: (l) => razao(Math.max(0, n(l, "missao_pres") - n(l, "missao_df")), n(l, "validos_pres")),
    votos: (l) => Math.max(0, n(l, "missao_pres") - n(l, "missao_df")),
    unidade: "dos válidos: votaram no Renan e não no Missão para Dep. Federal",
    formato: (x) => pct(x, 2),
  },
  {
    id: "oportunidade",
    rotulo: "Oportunidade",
    pergunta: "converter",
    pct: (l) => razao(n(l, "oportunidade"), n(l, "eleitorado")),
    votos: (l) => n(l, "oportunidade"),
    unidade: "do eleitorado (direita sem o Missão + Renan não convertido, Dep. Estadual)",
    formato: (x) => pct(x, 0),
    so: ["bairro"],
    motivo: "Só existe por bairro: abra uma cidade.",
  },
  { id: "direita", rotulo: "Direita sem o Missão", pergunta: "terreno", pct: (l) => razao(n(l, "direita_df"), n(l, "validos_df")), votos: (l) => n(l, "direita_df"), unidade: "dos válidos para Dep. Federal", formato: (x) => pct(x, 0) },
  { id: "lado", rotulo: "Pende para", pergunta: "terreno", pct: lado, unidade: "(Missão + direita − esquerda) ÷ válidos, Presidente", divergente: true, formato: pontos },
  {
    id: "andou",
    rotulo: "Andou desde 2022",
    pergunta: "terreno",
    pct: (l) => n(l, "var_lado_pres"),
    unidade: "para a direita (+) ou esquerda (−) desde 2022",
    divergente: true,
    formato: pontos,
    so: ["bairro"],
    motivo: "Só existe por bairro: abra uma cidade.",
  },
  { id: "comparecimento", rotulo: "Comparecimento", pergunta: "terreno", pct: (l) => razao(n(l, "comparecimento"), n(l, "eleitorado")), votos: (l) => n(l, "comparecimento"), unidade: "do eleitorado votou", formato: (x) => pct(x, 0) },
];

export const indicadorPorId = (id?: string) => INDICADORES_MAPA.find((i) => i.id === id) ?? INDICADORES_MAPA[0];

export const valeEm = (i: IndicadorMapa, tipo: TipoFilho | null) => !tipo || !i.so || i.so.includes(tipo);
