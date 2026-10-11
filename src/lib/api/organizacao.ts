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
  /** id do encontro na agenda pública — vira link /programacao#a-<id>; vazio quando não é público */
  atividade?: string;
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
  /** o vídeo em destaque (link https de Instagram, TikTok, YouTube ou X), ou vazio */
  destaque?: string;
}

/** O mês que passou: destaques da Liga e núcleos que entregaram — só nomes. */
export interface Reconhecimento {
  /** AAAA-MM */
  mes: string;
  portavozes: string[];
  nucleos: string[];
}

export interface Material {
  id: string;
  titulo: string;
  /** livro-amarelo, caderno, diagnostico, gravacao, guia */
  tipo: string;
  tipoNome: string;
  tema: string;
  resumo: string;
  /** https, onde o arquivo já mora */
  link: string;
}

export interface GrupoCultural {
  id: string;
  nome: string;
  /** chave em EIXOS_CULTURAIS (catalogo.ts) */
  eixo: string;
  /** 1 ideia · 2 atividade pontual · 3 projeto recorrente · 4 grupo permanente */
  nivel: number;
  cidade: string;
  bairro: string;
  ritmo: string;
  ativo: boolean;
  contato: string;
  proxima: Proxima | null;
}

export interface Organizacao {
  nucleos: Nucleo[];
  temas: Grupo[];
  portavozes: PortaVoz[];
  reconhecimento: Reconhecimento;
  biblioteca: Material[];
  cultura: GrupoCultural[];
}

export async function obterOrganizacao(): Promise<Organizacao> {
  const r = await apiFetch<Partial<Organizacao>>("/organizacao.php");
  return {
    nucleos: Array.isArray(r.nucleos) ? r.nucleos : [],
    temas: Array.isArray(r.temas) ? r.temas : [],
    /* Um painel mais velho que não manda os perfis não derruba a página. */
    portavozes: Array.isArray(r.portavozes) ? r.portavozes.map((p) => ({ ...p, perfis: p.perfis ?? {} })) : [],
    reconhecimento: {
      mes: r.reconhecimento?.mes ?? "",
      portavozes: r.reconhecimento?.portavozes ?? [],
      nucleos: r.reconhecimento?.nucleos ?? [],
    },
    biblioteca: Array.isArray(r.biblioteca) ? r.biblioteca : [],
    cultura: Array.isArray(r.cultura) ? r.cultura : [],
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
