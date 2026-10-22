import catalogo from "../../../public/painel/participacao-catalogo.json";

/** Catálogo compartilhado com PHP, incluído no deploy junto ao painel. */
export const PARTICIPACAO = catalogo;
export interface PerfilParticipacao {
  frentes: string[]; temas: string[]; cultura: string[]; contribuicoes: string[]; periodos: string[];
  situacao: string; disponibilidade: string; modalidade: string;
  profissao: string; instituicao: string; campus: string; cidadeInstituicao: string;
  curso: string; habilidades: string; ideia: string; perfilPublico: string;
}
export function perfilVazio(): PerfilParticipacao {
  return { frentes: [], temas: [], cultura: [], contribuicoes: [], periodos: [], situacao: "", disponibilidade: "", modalidade: "",
    profissao: "", instituicao: "", campus: "", cidadeInstituicao: "", curso: "", habilidades: "", ideia: "", perfilPublico: "" };
}
export function restaurarPerfil(bruto: unknown): PerfilParticipacao {
  const p = bruto && typeof bruto === "object" ? bruto as Record<string, unknown> : {};
  const novo = perfilVazio();
  for (const k of ["frentes", "temas", "cultura", "contribuicoes", "periodos"] as const) {
    const opcoes: Record<string, string> = PARTICIPACAO[k];
    const valores = p[k];
    if (Array.isArray(valores)) novo[k] = [...new Set(valores.filter((v): v is string => typeof v === "string" && Object.hasOwn(opcoes, v)))];
  }
  for (const [campo, lista] of [["situacao", "situacoes"], ["disponibilidade", "disponibilidades"], ["modalidade", "modalidades"]] as const) {
    const valor = p[campo];
    if (typeof valor === "string" && Object.hasOwn(PARTICIPACAO[lista], valor)) novo[campo] = valor;
  }
  for (const k of ["profissao", "instituicao", "campus", "cidadeInstituicao", "curso", "habilidades", "ideia", "perfilPublico"] as const) {
    if (typeof p[k] === "string") novo[k] = p[k].slice(0, ["habilidades", "ideia"].includes(k) ? 400 : k === "perfilPublico" ? 200 : k === "campus" ? 100 : 120);
  }
  return novo;
}
export function nomesSelecionados(opcoes: Record<string, string>, selecionadas: string[]): string {
  return selecionadas.map(k => opcoes[k]).filter(Boolean).join(", ");
}

export function normalizarInstituicao(nome: string): string {
  const chave = (v: string) => v.trim().toLocaleLowerCase("pt-BR").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return Object.entries(PARTICIPACAO.instituicoes).find(([, aliases]) => aliases.some(v => chave(v) === chave(nome)))?.[0] ?? nome;
}
