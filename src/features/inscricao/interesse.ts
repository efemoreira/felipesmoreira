/**
 * O INTERESSE DE QUEM SE INSCREVE — o núcleo ou o tema escolhido antes de
 * chegar ao formulário.
 *
 * Os botões de /nucleos ("Quero entrar neste núcleo") e de /temas ("Quero
 * entrar", "Quero ajudar a abrir") mandam `?unidade=<id>` ou `?tema=<chave>`.
 * Antes a escolha se perdia: a pessoa caía num /queroajudar genérico e a
 * coordenação não sabia que ela queria o Benfica.
 *
 * O formato é par de `PADRAO_INTERESSE` (dominio.php); `testes/contrato/interesse.test.ts` prende os dois. O
 * painel ainda confere se a unidade existe e está no site (`interesse_valido()`).
 */
export const FORMATO_INTERESSE = /^((nuc|grp|cul)-[a-f0-9]{6,20}|tema:[a-z]{3,20})$/;

/** O interesse que a URL pede, no formato do painel — ou "". */
export function interesseDaUrl(busca: URLSearchParams): string {
  const unidade = busca.get("unidade") ?? "";
  if (FORMATO_INTERESSE.test(unidade) && !unidade.startsWith("tema:")) return unidade;
  const tema = busca.get("tema") ?? "";
  const comoTema = `tema:${tema}`;
  return tema && FORMATO_INTERESSE.test(comoTema) ? comoTema : "";
}
