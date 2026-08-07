/**
 * Caminhos que a moldura e as placas de texto compartilham.
 *
 * Fica fora dos componentes de propósito: `texto.ts` desenha no contexto 2D
 * nativo e `Moldura.tsx` no contexto do Konva. Os dois entendem `beginPath`,
 * `moveTo`, `lineTo` e `closePath`, então é só isso que o tipo daqui exige.
 */
export interface Tracador {
  beginPath: () => void;
  moveTo: (x: number, y: number) => void;
  lineTo: (x: number, y: number) => void;
  closePath: () => void;
}

/**
 * Retângulo com as quatro quinas cortadas em 45°.
 *
 * É o acabamento de placa das referências — o canto redondo do `raio` dá um ar
 * de botão de aplicativo, o corte reto dá o de selo impresso.
 */
export function caminhoChanfrado(
  ctx: Tracador,
  x: number,
  y: number,
  w: number,
  h: number,
  chanfro: number,
) {
  const c = Math.max(0, Math.min(chanfro, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.lineTo(x, y + c);
  ctx.closePath();
}
