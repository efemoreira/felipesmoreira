import type { Linha } from "./dados";

const ausente = (v: unknown) => v === undefined || v === null || v === "" || (typeof v === "number" && !Number.isFinite(v));
const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });

/** Ausências ficam no fim nas duas direções; dois ausentes são equivalentes. */
export function compararValores(a: unknown, b: unknown, desc: boolean): number {
  if (ausente(a) || ausente(b)) return ausente(a) === ausente(b) ? 0 : ausente(a) ? 1 : -1;
  const result = typeof a === "number" && typeof b === "number" ? a - b : collator.compare(String(a), String(b));
  return desc ? -result : result;
}

type ColunaCsv = { chave: string; rotulo: string; tipo?: string; valor?: (l: Linha) => number | string };

/** Preserva acentos, porcentagens e quebras de linha; texto nunca vira fórmula. */
export function gerarCsv(linhas: Linha[], colunas: ColunaCsv[]): string {
  const campo = (v: unknown, percentual = false) => {
    if (ausente(v)) return "";
    let s = typeof v === "number" ? String(percentual ? v * 100 : v).replace(".", ",") + (percentual ? "%" : "") : String(v);
    if (typeof v === "string" && /^[\s]*[=+\-@]/.test(s)) s = "'" + s;
    return /[;"\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return "\uFEFF" + [colunas.map((c) => campo(c.rotulo)).join(";"), ...linhas.map((l) => colunas.map((c) => campo(c.valor ? c.valor(l) : l[c.chave], c.tipo === "pct")).join(";"))].join("\r\n");
}

type ColunaEnxuta = { chave: string; rotulo: string; valor?: (l: Linha) => number | string; fixavel?: boolean };
export type Fixa = { rotulo: string; valor: string };

/**
 * Tira da tabela o que não informa: coluna sem nenhum valor some, e coluna
 * `fixavel` com um valor só em todas as linhas sai da grade e vira frase
 * ("Conferência: Conferido em todas as linhas"). Com uma linha só, nada é fixo.
 */
export function enxugarColunas<C extends ColunaEnxuta>(linhas: Linha[], colunas: C[]): { colunas: C[]; fixas: Fixa[] } {
  const fixas: Fixa[] = [];
  const ficam = colunas.filter((c, i) => {
    if (i === 0) return true;
    const valores = linhas.map((l) => (c.valor ? c.valor(l) : l[c.chave]));
    if (linhas.length > 0 && valores.every(ausente)) return false;
    if (!c.fixavel || linhas.length < 2) return true;
    const unicos = new Set(valores.map((v) => (ausente(v) ? "" : String(v))));
    if (unicos.size !== 1) return true;
    const [v] = unicos;
    if (v === "") return false;
    fixas.push({ rotulo: c.rotulo, valor: typeof valores[0] === "number" ? (valores[0] as number).toLocaleString("pt-BR") : v });
    return false;
  });
  return { colunas: ficam, fixas };
}
