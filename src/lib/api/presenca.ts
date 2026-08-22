import { ApiError, apiFetch } from "./client";
import type {
  Alvo,
  DadosPresenca,
  Encontro,
  RespostaPresenca,
  RespostaProcura,
} from "@/features/presenca/tipos";

/**
 * A presença nos encontros (public/painel/api/presenca.php).
 *
 * É endpoint aberto: quem chega no encontro não tem conta no painel. Por isso
 * nada aqui depende de sessão — o que identifica o encontro é o token da URL,
 * e qual dos dois tokens veio é o que decide se a pessoa está confirmando que
 * vai ou dizendo que chegou.
 */

/** Confere o token antes de mostrar o formulário: link velho não pede dados. */
export function obterEncontro(alvo: Alvo): Promise<Encontro> {
  const q = alvo.evento
    ? `e=${encodeURIComponent(alvo.evento)}`
    : `c=${encodeURIComponent(alvo.confirmacao ?? "")}`;
  return apiFetch<Encontro>(`/presenca.php?${q}`);
}

/**
 * Recusa de validação vem como 4xx com `{ok:false, erro}`. Devolvemos isso como
 * valor, e não como exceção, porque para quem está na porta do evento "confira
 * o DDD" não é uma falha do sistema — é a resposta.
 */
async function postar<T>(corpo: Record<string, unknown>): Promise<T | { ok: false; erro: string }> {
  try {
    return await apiFetch<T>("/presenca.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
    });
  } catch (e) {
    const erro = e instanceof ApiError ? (e.corpo as { erro?: string } | null)?.erro : undefined;
    if (erro) {
      return { ok: false, erro };
    }
    throw e;
  }
}

/** Passo 1: só o telefone. O servidor procura nas presenças, inscrições e contas. */
export function procurarPessoa(alvo: Alvo, telefone: string, site: string) {
  return postar<RespostaProcura>({ ...alvo, acao: "procurar", telefone, site });
}

/** Passo 2, só quando o mesmo número tem mais de uma pessoa: "sou este aqui". */
export function confirmarPessoa(alvo: Alvo, telefone: string, ref: string, site: string) {
  return postar<RespostaPresenca>({ ...alvo, acao: "confirmar", telefone, ref, site });
}

/** Passo 3, para quem o sistema não conhece: a ficha curta. */
export function enviarPresenca(alvo: Alvo, dados: DadosPresenca) {
  return postar<RespostaPresenca>({ ...alvo, ...dados });
}
