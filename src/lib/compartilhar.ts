/**
 * Compartilhar texto (e, quando houver, uma arte) pelo caminho que o celular
 * entende.
 *
 * Nasceu dentro do `baixar()` do KitClient e mudou de casa quando a tela de
 * confirmação da inscrição passou a precisar da mesma coisa. As armadilhas da
 * Web Share API não são óbvias e não vale descobri-las duas vezes:
 *
 * - `canShare` dizer que sim **não garante** que o `share` vai. Sem gesto do
 *   usuário, ou em navegador que anuncia a API e não a entrega, ele rejeita —
 *   e aí é obrigatório ter um plano B, senão o militante fica sem a peça por
 *   causa de detalhe de navegador.
 * - `AbortError` é a pessoa fechando o menu. Isso não é erro e não pode virar
 *   aviso vermelho na tela.
 */

/** O que aconteceu — quem chama decide o que dizer ao usuário. */
export type Resultado =
  /** abriu o menu do sistema (WhatsApp, etc.) */
  | "compartilhou"
  /** a pessoa fechou o menu: não é erro, não avise nada */
  | "cancelou"
  /** não deu para compartilhar; o texto foi para a área de transferência */
  | "copiou"
  /** nem uma coisa nem outra — aí sim é hora de avisar */
  | "falhou";

/**
 * Compartilha um texto. Cai para a área de transferência quando o aparelho não
 * tem o menu de compartilhar — que é o caso do computador, onde copiar e colar
 * no grupo é o gesto natural mesmo.
 */
export async function compartilharTexto(texto: string, url?: string): Promise<Resultado> {
  const dados = url ? { text: texto, url } : { text: texto };

  if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
    try {
      await navigator.share(dados);
      return "compartilhou";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelou";
      /* qualquer outra falha cai na cópia abaixo */
    }
  }
  return copiar(url ? `${texto}\n${url}` : texto);
}

/** Copia para a área de transferência. */
export async function copiar(texto: string): Promise<Resultado> {
  try {
    await navigator.clipboard.writeText(texto);
    return "copiou";
  } catch {
    return "falhou";
  }
}
