import type { Filtros, Verbete } from "./tipos";

export const normalizar = (texto: string) => texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export const tempo = (segundos: number) => `${Math.floor(segundos / 60)}:${String(Math.floor(segundos % 60)).padStart(2, "0")}`;
export const nomeCanonico = (nome: string) => ({ Lula: "Luiz Inácio Lula da Silva", "Renan Antônio Ferreira dos Santos": "Renan Santos", "Renan Antônio dos Santos": "Renan Santos", "Renan dos Santos": "Renan Santos", "Mamãe Falei": "Arthur do Val" }[nome] ?? nome);
export const slugPessoa = (nome: string) => normalizar(nomeCanonico(nome)).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const enderecoPessoa = (nome: string) => `/iceberg/pessoas/${slugPessoa(nome)}`;
export function filtrar(verbetes: Verbete[], filtros: Filtros): Verbete[] {
  const busca = normalizar(filtros.busca.trim());
  return verbetes.filter(v => {
    const texto = normalizar([v.title, v.originalTitle, v.summary, v.outcome, ...v.people].join(" "));
    const periodo = filtros.periodo;
    const ano = v.year;
    return (!busca || texto.includes(busca)) && (filtros.serie === "todas" || v.series === filtros.serie)
      && (filtros.natureza === "todas" || v.status === filtros.natureza)
      && (!filtros.camada || v.layer === filtros.camada)
      && (periodo === "todos" || (periodo === "sem-data" ? ano === null : ano !== null && (periodo === "antigos" ? ano < 2000 : ano >= Number(periodo) && ano < Number(periodo) + 10)));
  });
}
export function ordenar(verbetes: Verbete[], ordem: "antigos" | "recentes"): Verbete[] {
  return [...verbetes].sort((a, b) => a.year === null ? (b.year === null ? a.id.localeCompare(b.id) : 1) : b.year === null ? -1 : (a.year - b.year) * (ordem === "recentes" ? -1 : 1) || a.id.localeCompare(b.id, "pt-BR", { numeric: true }));
}
/** Coocorrência de nomes não significa causalidade. Vínculos explícitos vêm primeiro. */
export function relacionados(verbete: Verbete, acervo: Verbete[]): Verbete[] {
  const pontuacao = (v: Verbete) => (verbete.relatedIds?.includes(v.id) || v.relatedIds?.includes(verbete.id) ? 100 : 0) + v.people.filter(p => verbete.people.includes(p)).length;
  return acervo.filter(v => v.id !== verbete.id && pontuacao(v) > 0).sort((a, b) => pontuacao(b) - pontuacao(a)).slice(0, 8);
}
export function dominio(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "Fonte original"; } }
