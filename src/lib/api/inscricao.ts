import { ApiError, apiFetch } from "./client";

/**
 * A inscrição do /queroajudar (public/painel/api/inscricao.php).
 *
 * Endpoint aberto, sem sessão: quem se inscreve ainda não tem conta. A recusa
 * de validação vem como 4xx com `{ok:false, erro}`, e volta daqui como VALOR —
 * "confira o DDD" não é falha do sistema, é a resposta para quem preenche.
 * Rede fora vira `{ok:false, erro:""}`: quem chama escreve a frase.
 *
 * Existe para o formulário não ter `fetch` próprio — foi assim que ele ficou
 * fora do cliente por meses, e a regra "toda chamada passa por `apiFetch`"
 * tinha uma exceção que ninguém via.
 */
export interface Inscricao {
  nome: string;
  telefone: string;
  email: string;
  cidade: string;
  bairro: string;
  funcoes: string[];
  de: string;
  consentimento: true;
  /** o campo-armadilha: vazio em gente, preenchido por robô */
  site: string;
}

export async function enviarInscricao(dados: Inscricao): Promise<{ ok: true } | { ok: false; erro: string }> {
  try {
    const r = await apiFetch<{ ok?: boolean; erro?: string }>("/inscricao.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    return r.ok ? { ok: true } : { ok: false, erro: r.erro ?? "" };
  } catch (e) {
    const erro = e instanceof ApiError ? (e.corpo as { erro?: string } | null)?.erro : undefined;
    return { ok: false, erro: erro ?? "" };
  }
}
