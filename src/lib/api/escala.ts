import { apiFetch } from "./client";

/**
 * O convite de escala (public/painel/api/escala.php).
 *
 * Endpoint aberto, como a presença e a inscrição: quem é escalado nem sempre
 * tem conta no painel — das 72 pessoas na fila, 58 escolheram função antes de
 * qualquer aprovação. Exigir login para dizer "topo" seria pedir que a pessoa
 * entre no sistema para poder ajudar.
 *
 * O que autoriza é o token da URL, derivado no servidor a partir do segredo do
 * site. Nada é guardado, e trocar a pessoa de peça invalida o link antigo.
 */

/** Os quatro parâmetros que identificam um convite. Vêm todos da URL. */
export interface Alvo {
  p: string;
  e: string;
  f: string;
  t: string;
}

export interface Convite {
  existe: boolean;
  nome?: string;
  peca?: string;
  titulo?: string;
  quando?: string;
  local?: string;
  itens?: string[];
  /** O que ela já respondeu antes, se respondeu: 'topou' | 'nao-posso' | ''. */
  resposta?: string;
}

export interface RespostaEnviada {
  ok: boolean;
  existe?: boolean;
  erro?: string;
  resposta?: string;
}

function querystring(alvo: Alvo): string {
  return new URLSearchParams(alvo as unknown as Record<string, string>).toString();
}

/** Confere o token antes de mostrar o convite: link velho não mostra encontro. */
export function obterConvite(alvo: Alvo): Promise<Convite> {
  return apiFetch<Convite>(`/escala.php?${querystring(alvo)}`);
}

export function responderConvite(alvo: Alvo, resposta: "topou" | "nao-posso"): Promise<RespostaEnviada> {
  return apiFetch<RespostaEnviada>("/escala.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...alvo, resposta }),
  });
}
