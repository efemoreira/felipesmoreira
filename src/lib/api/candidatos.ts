import { apiFetch } from "./client";

/**
 * Os candidatos da chapa e as listas, cadastrados no painel.
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
  /** caminho da foto, ou vazio — candidato sem foto é candidato válido */
  imagem: string;
}

/**
 * Uma lista é um nome e quem está nela — "Deputados federais", "As mulheres da
 * chapa", "Os que eu apoio". É ela que vira uma colinha.
 *
 * Não são categorias fixas no código: lista é conteúdo de campanha e muda toda
 * semana. A ordem de `candidatos` é a ordem da colinha, e é decisão de quem
 * montou — quem vem primeiro é quem se quer que seja lembrado primeiro.
 */
export interface Lista {
  id: string;
  nome: string;
  descricao: string;
  /** ids, na ordem em que devem aparecer */
  candidatos: string[];
  /** a única que a página inicial mostra */
  naHome: boolean;
}

export interface Chapa {
  candidatos: Candidato[];
  listas: Lista[];
}

export async function obterChapa(): Promise<Chapa> {
  const r = await apiFetch<Partial<Chapa>>("/candidatos.php");
  return {
    candidatos: Array.isArray(r.candidatos) ? r.candidatos : [],
    listas: Array.isArray(r.listas) ? r.listas : [],
  };
}

/** Resolve os ids de uma lista nas fichas, na ordem em que ela os guardou. */
export function pessoasDa(lista: Lista, candidatos: Candidato[]): Candidato[] {
  const porId = new Map(candidatos.map((c) => [c.id, c]));
  return lista.candidatos
    .map((id) => porId.get(id))
    .filter((c): c is Candidato => c !== undefined);
}
