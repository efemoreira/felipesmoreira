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
  /** a chave do cargo em `CARGOS` (dominio.php), ou vazio */
  chave: string;
  /** a seção onde aparece: o cargo de quem encabeça (`cargo_titular()`) */
  secao: string;
  /** vice ou suplente — aparece no site, nunca na colinha */
  vice: boolean;
  /** id do titular no ar, quando é vice; vazio se o titular ainda não está no ar */
  titular: string;
  /** o link do botão "Ver redes"; vazio quando só há o Instagram */
  linkRedes: string;
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

/** Completa o que um painel mais velho ainda não manda, em vez de quebrar a página. */
function completar(c: Partial<Candidato>): Candidato {
  return {
    id: c.id ?? "",
    nome: c.nome ?? "",
    cargo: c.cargo ?? "",
    numero: c.numero ?? "",
    partido: c.partido ?? "",
    instagram: c.instagram ?? "",
    imagem: c.imagem ?? "",
    chave: c.chave ?? "",
    secao: c.secao ?? c.chave ?? "",
    vice: c.vice === true,
    titular: c.titular ?? "",
    linkRedes: c.linkRedes ?? "",
  };
}

export async function obterChapa(): Promise<Chapa> {
  const r = await apiFetch<{ candidatos?: Partial<Candidato>[]; listas?: Lista[] }>("/candidatos.php");
  return {
    candidatos: Array.isArray(r.candidatos) ? r.candidatos.map(completar) : [],
    listas: Array.isArray(r.listas) ? r.listas : [],
  };
}

/** Para onde vai o botão "Ver redes": o link que a coordenação pôs, ou o Instagram. */
export function linkDasRedes(c: Candidato): string {
  if (c.linkRedes) return c.linkRedes;
  return c.instagram ? `https://instagram.com/${c.instagram}` : "";
}

/** Resolve os ids de uma lista nas fichas, na ordem em que ela os guardou. */
export function pessoasDa(lista: Lista, candidatos: Candidato[]): Candidato[] {
  const porId = new Map(candidatos.map((c) => [c.id, c]));
  return lista.candidatos
    .map((id) => porId.get(id))
    .filter((c): c is Candidato => c !== undefined);
}
