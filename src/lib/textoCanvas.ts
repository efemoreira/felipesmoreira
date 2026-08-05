/**
 * Medição de texto no canvas — compartilhado entre o pôster da programação e o
 * estúdio de artes.
 *
 * A quebra de linha não mora aqui: o pôster quebra frases inteiras com
 * reticências, e o estúdio quebra palavra a palavra porque cada uma pode ter
 * cor própria. Só a medição é a mesma nos dois.
 */

/** Mede o texto respeitando o letter-spacing, que o `measureText` ignora sem o hint. */
export function medir(
  ctx: CanvasRenderingContext2D,
  txt: string,
  font: string,
  espaco = 0,
): number {
  ctx.save();
  ctx.font = font;
  if (espaco && "letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${espaco}px`;
  }
  const w = ctx.measureText(txt).width;
  ctx.restore();
  return w;
}
