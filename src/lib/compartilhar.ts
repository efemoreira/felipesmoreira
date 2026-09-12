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

/**
 * ENTREGAR A ARTE — compartilhar no celular, baixar no resto.
 *
 * Era a mesma sequência escrita três vezes (Munição, pôster da programação,
 * colinha): `canShare` → `share` → se não, `<a download>`. E os mesmos dois
 * cuidados em cada cópia: `canShare` dizer que sim não garante que o `share`
 * vai (sem gesto do usuário, navegador que anuncia e não entrega), então a
 * arte tem de baixar assim mesmo — militante no meio do mutirão não pode
 * ficar sem ela por detalhe de navegador; e só o cancelamento dele encerra
 * em silêncio. Devolve o que aconteceu, para quem chama contar o sinal. É o irmão de
 * `compartilharTexto()`: o mesmo cuidado, com arquivo em vez de texto.
 */
export async function entregarArte(
  blob: Blob,
  nome: string,
  texto: string,
  titulo?: string,
): Promise<"compartilhou" | "baixou" | "cancelou"> {
  const arquivo = new File([blob], nome, { type: "image/png" });
  if (typeof navigator.canShare === "function" && navigator.canShare({ files: [arquivo] })) {
    try {
      await navigator.share({ files: [arquivo], text: texto, ...(titulo ? { title: titulo } : {}) });
      return "compartilhou";
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return "cancelou";
      /* qualquer outra falha: cai no download abaixo */
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  /* Soltar a URL no tique seguinte, não na mesma linha: alguns navegadores só
     começam a leitura depois do clique voltar, e revogar imediatamente aborta
     o download que acabou de começar. */
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return "baixou";
}
