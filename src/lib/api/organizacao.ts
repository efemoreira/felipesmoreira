import { apiFetch } from "./client";

/**
 * A organização pública — núcleos, grupos temáticos e porta-vozes da Liga,
 * cadastrados no painel (`/painel/organizacao`).
 *
 * Endpoint público e sem sessão (`api/organizacao.php`). Só desce o que a
 * coordenação marcou para o site, e nunca nome de responsável: "nenhuma lista
 * de participantes ou contato pessoal em página pública". O porta-voz é
 * público por função, e `publicado` é a autorização dele.
 */

export interface Proxima {
  /** AAAA-MM-DD, sempre hoje ou depois */
  data: string;
  texto: string;
}

export interface Nucleo {
  id: string;
  nome: string;
  tipo: "bairro" | "cidade" | "universidade";
  cidade: string;
  bairro: string;
  /** 1, 2, 3 — ou 0, mapear */
  onda: number;
  /** T0 a T4 */
  nivel: string;
  /** "Toda semana", "A cada quinze dias", "Uma vez por mês" */
  ritmo: string;
  ativo: boolean;
  /** link https público (grupo, canal) ou vazio */
  contato: string;
  proxima: Proxima | null;
}

export interface Grupo {
  id: string;
  /** a chave em TEMAS_GRUPO (organizacao-comum.php) / TEMAS (catalogo.ts) */
  tema: string;
  finalidade: string;
  maturidade: number;
  ritmo: string;
  ativo: boolean;
  portas: { estudo: string; profissionais: string; movimento: string };
  /** nomes dos núcleos parceiros que também estão no site */
  nucleos: string[];
  /** nome público do porta-voz do tema, ou vazio */
  portaVoz: string;
  contato: string;
  proxima: Proxima | null;
}

export interface PortaVoz {
  id: string;
  nome: string;
  tema: string;
  cidade: string;
  bairro: string;
  /** E, D, C, B ou A */
  nivel: string;
  /** só os @ preenchidos, sem arroba */
  perfis: Partial<Record<"instagram" | "tiktok" | "youtube" | "x", string>>;
}

export interface Organizacao {
  nucleos: Nucleo[];
  temas: Grupo[];
  portavozes: PortaVoz[];
}

export async function obterOrganizacao(): Promise<Organizacao> {
  const r = await apiFetch<Partial<Organizacao>>("/organizacao.php");
  return {
    nucleos: Array.isArray(r.nucleos) ? r.nucleos : [],
    temas: Array.isArray(r.temas) ? r.temas : [],
    /* Um painel mais velho que não manda os perfis não derruba a página. */
    portavozes: Array.isArray(r.portavozes) ? r.portavozes.map((p) => ({ ...p, perfis: p.perfis ?? {} })) : [],
  };
}

/** O link de um perfil a partir do @ — o painel guarda só o @. */
export function linkDoPerfil(rede: string, arroba: string): string {
  const a = arroba.replace(/^@/, "");
  switch (rede) {
    case "instagram":
      return `https://instagram.com/${a}`;
    case "tiktok":
      return `https://tiktok.com/@${a}`;
    case "youtube":
      return `https://youtube.com/@${a}`;
    case "x":
      return `https://x.com/${a}`;
    default:
      return "";
  }
}
