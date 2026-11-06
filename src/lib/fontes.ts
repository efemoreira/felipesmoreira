/**
 * Ponte entre as fontes do next/font e o canvas.
 *
 * O next/font entrega a família por uma CSS var (`--font-anton`), e `ctx.font`
 * não entende `var(...)`. A saída daqui é uma string pronta para `ctx.font`.
 */

const cache = new Map<string, string>();

/**
 * Resolve `var(--font-x)` para o nome real da família.
 *
 * A sonda precisa nascer *dentro* do elemento que declara a variável: o
 * next/font entrega a família por uma classe, e uma página que só aplica essa
 * classe num contêiner não resolveria a variável no `document.body`.
 */
export function familia(variavel: string, reserva: string, raiz?: HTMLElement | null): string {
  const dono = raiz ?? document.body;
  const chave = `${variavel}@${dono.id || "body"}`;

  const guardado = cache.get(chave);
  if (guardado) return guardado;

  const probe = document.createElement("span");
  probe.style.cssText = `position:absolute;visibility:hidden;font-family:var(${variavel})`;
  dono.appendChild(probe);
  const f = getComputedStyle(probe).fontFamily;
  probe.remove();

  const resolvida = f || reserva;
  cache.set(chave, resolvida);
  return resolvida;
}

/**
 * Esquece o que já foi resolvido.
 * Chamar depois de `fontesProntas()`: antes disso o navegador pode devolver a
 * fonte de reserva, e esse valor não pode ficar guardado para sempre.
 */
export const limparCacheDeFontes = () => cache.clear();

/* As fontes das artes em canvas e do Estúdio. Special Elite e Bitter nenhuma
   página escreve, então o navegador não as baixa sozinho: `document.fonts.ready`
   só espera o que está em uso, e a arte sairia com a fonte errada sem ninguém
   notar. */
const FONTES_DAS_ARTES = ["--font-alfa", "--font-texto", "--font-elite", "--font-bitter"];

/**
 * Espera as fontes carregarem antes de desenhar.
 * Sem isso o primeiro desenho sai com a fonte de fallback e as medidas erram.
 */
export async function fontesProntas(): Promise<void> {
  if (typeof document === "undefined") return;
  try {
    await Promise.all(FONTES_DAS_ARTES.map((v) => document.fonts.load(`16px ${familia(v, "serif")}`)));
    await document.fonts.ready;
  } catch {
    /* navegador antigo: segue com o que tiver */
  }
}
