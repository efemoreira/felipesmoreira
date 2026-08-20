import { ApiError, apiFetch } from "./client";
import type { DadosPresenca, Encontro, RespostaPresenca } from "@/features/presenca/tipos";

/**
 * A lista de presença dos encontros (public/painel/api/presenca.php).
 *
 * É endpoint aberto: quem chega no encontro não tem conta no painel. Por isso
 * nada aqui depende de sessão — o que identifica o encontro é o token do QR.
 */

/** Confere o token antes de mostrar o formulário: link velho não pede dados. */
export function obterEncontro(token: string): Promise<Encontro> {
  return apiFetch<Encontro>(`/presenca.php?e=${encodeURIComponent(token)}`);
}

/**
 * Recusa de validação vem como 4xx com `{ok:false, erro}`. Devolvemos isso como
 * valor, e não como exceção, porque para quem está na porta do evento "confira
 * o DDD" não é uma falha do sistema — é a resposta.
 */
export async function enviarPresenca(dados: DadosPresenca): Promise<RespostaPresenca> {
  try {
    return await apiFetch<RespostaPresenca>("/presenca.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
  } catch (e) {
    const erro = e instanceof ApiError ? (e.corpo as { erro?: string } | null)?.erro : undefined;
    if (erro) {
      return { ok: false, erro };
    }
    throw e;
  }
}
