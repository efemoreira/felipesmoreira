/** Números no jeito brasileiro. Valor ausente vira travessão, nunca "NaN". */

const vazio = (x: number) => x === undefined || x === null || Number.isNaN(x) || !Number.isFinite(x);

export function num(x: number, casas = 0): string {
  if (vazio(x)) return "—";
  return x.toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/**
 * Percentual. Duas casas só valem abaixo de 1% (0,37% ≠ 0,4%); acima disso a
 * segunda casa é ruído para quem lê, e `pct(x, 2)` cai para uma.
 */
export function pct(x: number, casas = 1): string {
  if (vazio(x)) return "—";
  const c = casas === 2 && Math.abs(x) >= 0.01 ? 1 : casas;
  return `${num(x * 100, c)}%`;
}

/** Diferença em pontos percentuais: +0,4 pt · −1,2 pt. */
export function pts(x: number, casas = 1): string {
  if (vazio(x)) return "—";
  const v = x * 100;
  const s = num(Math.abs(v), casas);
  if (Number(s.replace(",", ".")) === 0) return `${s} pt`;
  return `${v > 0 ? "+" : "−"}${s} pt`;
}

/** 156 mi · 1,2 mi · 806 mil · 7.980 */
export function compacto(x: number): string {
  if (vazio(x)) return "—";
  if (Math.abs(x) >= 1e6) return `${num(x / 1e6, Math.abs(x) >= 1e8 ? 0 : 1)} mi`;
  if (Math.abs(x) >= 1e4) return `${num(x / 1e3, 0)} mil`;
  return num(x);
}

/** Quocientes: "1,94 QE". */
export function qe(x: number): string {
  return vazio(x) ? "—" : `${num(x, 2)} QE`;
}

export const UF_NOMES: Record<string, string> = {
  ac: "Acre", al: "Alagoas", am: "Amazonas", ap: "Amapá", ba: "Bahia", ce: "Ceará", df: "Distrito Federal",
  es: "Espírito Santo", go: "Goiás", ma: "Maranhão", mg: "Minas Gerais", ms: "Mato Grosso do Sul",
  mt: "Mato Grosso", pa: "Pará", pb: "Paraíba", pe: "Pernambuco", pi: "Piauí", pr: "Paraná",
  rj: "Rio de Janeiro", rn: "Rio Grande do Norte", ro: "Rondônia", rr: "Roraima", rs: "Rio Grande do Sul",
  sc: "Santa Catarina", se: "Sergipe", sp: "São Paulo", to: "Tocantins", zz: "Exterior",
};

/** Código IBGE da UF — é a chave do contorno em `mapa/br.json`. */
export const UF_IBGE: Record<string, string> = {
  ro: "11", ac: "12", am: "13", rr: "14", pa: "15", ap: "16", to: "17", ma: "21", pi: "22", ce: "23", rn: "24",
  pb: "25", pe: "26", al: "27", se: "28", ba: "29", mg: "31", es: "32", rj: "33", sp: "35", pr: "41", sc: "42",
  rs: "43", ms: "50", mt: "51", go: "52", df: "53",
};

export const nomeUf = (uf: string) => `${UF_NOMES[uf] ?? uf.toUpperCase()} (${uf.toUpperCase()})`;

/** "SÃO PAULO" → "São Paulo" (preposições em minúscula). */
export function titulo(s: string): string {
  return s
    .toLowerCase()
    .split(" ")
    .map((p, i) => (i > 0 && ["de", "da", "do", "das", "dos", "e"].includes(p) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}
