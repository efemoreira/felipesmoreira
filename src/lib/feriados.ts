/**
 * Os feriados de 2026–2027 — par de `FERIADOS` em public/painel/feriados-comum.php.
 *
 * O painel usa para avisar quem marca encontro em feriado; o site usa para
 * dizer na ficha da atividade que o dia é feriado. Saem do calendário do plano
 * (/plano). `testes/contrato/feriados.test.ts` prende os dois.
 */
export type OndeFeriado = "nacional" | "ceara" | "fortaleza" | "facultativo";

export const FERIADOS: Record<string, { nome: string; onde: OndeFeriado }> = {
  "2026-10-12": { nome: "Nossa Senhora Aparecida", onde: "nacional" },
  "2026-11-02": { nome: "Finados (Romaria em Juazeiro do Norte)", onde: "nacional" },
  "2026-11-15": { nome: "Proclamação da República", onde: "nacional" },
  "2026-11-20": { nome: "Dia de Zumbi e da Consciência Negra", onde: "nacional" },
  "2026-12-25": { nome: "Natal", onde: "nacional" },
  "2027-01-01": { nome: "Confraternização Universal", onde: "nacional" },
  "2027-02-08": { nome: "Carnaval", onde: "facultativo" },
  "2027-02-09": { nome: "Carnaval", onde: "facultativo" },
  "2027-02-10": { nome: "Quarta-feira de Cinzas (meio expediente)", onde: "facultativo" },
  "2027-03-19": { nome: "São José, padroeiro do Ceará", onde: "fortaleza" },
  "2027-03-25": { nome: "Data Magna do Ceará", onde: "ceara" },
  "2027-03-26": { nome: "Sexta-feira da Paixão", onde: "nacional" },
  "2027-04-21": { nome: "Tiradentes", onde: "nacional" },
  "2027-05-01": { nome: "Dia do Trabalho", onde: "nacional" },
  "2027-05-27": { nome: "Corpus Christi", onde: "fortaleza" },
  "2027-08-15": { nome: "Nossa Senhora da Assunção, padroeira de Fortaleza", onde: "fortaleza" },
  "2027-09-07": { nome: "Independência do Brasil", onde: "nacional" },
  "2027-10-12": { nome: "Nossa Senhora Aparecida", onde: "nacional" },
  "2027-11-02": { nome: "Finados", onde: "nacional" },
  "2027-11-15": { nome: "Proclamação da República", onde: "nacional" },
  "2027-11-20": { nome: "Dia de Zumbi e da Consciência Negra", onde: "nacional" },
  "2027-12-25": { nome: "Natal", onde: "nacional" },
};

/** O feriado de um dia para uma cidade — municipal de Fortaleza só vale lá. Par de `feriado_em()`. */
export function feriadoEm(dia: string, cidade = ""): { nome: string; onde: OndeFeriado } | null {
  const f = FERIADOS[dia];
  if (!f) return null;
  if (f.onde === "fortaleza" && cidade !== "" && cidade !== "Fortaleza") return null;
  return f;
}
