import { apiFetch } from "./client";
import type { RespostaAulas } from "@/features/aulas/tipos";

/**
 * Busca a formação em public/painel/api/aulas.php — a única porta do conteúdo
 * das aulas. Usa o mesmo cookie do painel (ver sessao.ts): quem não tem a área
 * "aulas" recebe `pode: false` e nenhuma linha do texto.
 *
 * O endpoint sempre responde 200 com o estado no corpo, então aqui só falha de
 * rede mesmo.
 */
export function obterAulas(convite?: string): Promise<RespostaAulas> {
  /* Com token, o painel devolve só o Dia 0 e `convidado: true`. É como quem se
     inscreveu e ainda não foi aprovado começa a formação sem esperar. */
  const q = convite ? `?convite=${encodeURIComponent(convite)}` : "";
  return apiFetch<RespostaAulas>(`/aulas.php${q}`);
}

/** Marca ou desmarca uma aula. Devolve a lista de concluídas já atualizada. */
export async function marcarAula(aula: string, concluida: boolean): Promise<string[]> {
  const r = await apiFetch<{ ok: boolean; concluidas?: string[] }>("/aulas.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ acao: concluida ? "concluir" : "desfazer", aula }),
  });
  return r.concluidas ?? [];
}
