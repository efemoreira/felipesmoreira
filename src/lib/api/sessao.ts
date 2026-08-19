import { apiFetch } from "./client";

export type Sessao =
  | { autenticado: true; login: string; papel: "admin" | "editor"; areas: string[] }
  | { autenticado: false };

/**
 * Pergunta ao painel (public/painel/api/sessao.php) quem é o visitante e quais
 * áreas ele pode abrir. Usa o cookie `painel_agenda` que o painel já emite no
 * login — não existe um segundo sistema de sessão no lado do Next. O endpoint
 * sempre responde 200 (autenticado: false quando não há sessão), então não há
 * necessidade de tratar erro de autenticação aqui — só falha de rede mesmo.
 */
export function obterSessao(): Promise<Sessao> {
  return apiFetch<Sessao>("/sessao.php");
}

export function podeAbrir(sessao: Sessao, area: string): boolean {
  return sessao.autenticado && sessao.areas.includes(area);
}
