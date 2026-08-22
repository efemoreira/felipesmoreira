import { apiFetch } from "./client";

/**
 * Os candidatos da chapa, cadastrados no painel.
 *
 * Endpoint público e sem sessão: nome de urna, cargo, número e perfil de
 * candidato registrado são informação pública por definição legal. Trancar isso
 * atrás de login só impediria o eleitor de conferir o número antes de votar.
 *
 * Vem do painel, e não de um arquivo no repositório, porque nome de urna e
 * número saem do registro no TSE e mudam até a véspera — lista no código é
 * lista que exige um deploy para corrigir um dígito.
 */
export interface Candidato {
  id: string;
  /** o nome de urna, quando existe; senão o nome de registro */
  nome: string;
  cargo: string;
  numero: string;
  partido: string;
  /** só o @, sem arroba; vazio quando a pessoa não tem perfil */
  instagram: string;
  grupos: string[];
}

/** Os grupos, na ordem em que a página os mostra. Espelha GRUPOS_CANDIDATO. */
export const GRUPOS: { id: string; nome: string }[] = [
  { id: "presidente", nome: "Presidente" },
  { id: "governador", nome: "Governo do Ceará" },
  { id: "federais", nome: "Deputado Federal" },
  { id: "estaduais", nome: "Deputado Estadual" },
  { id: "mulheres", nome: "Mulheres" },
];

export async function obterCandidatos(): Promise<Candidato[]> {
  const r = await apiFetch<{ candidatos?: Candidato[] }>("/candidatos.php");
  return Array.isArray(r.candidatos) ? r.candidatos : [];
}
