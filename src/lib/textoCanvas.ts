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

/** Quanto o texto sobe e desce da linha de base, de verdade. */
export interface Extremos {
  /** px acima da base — a altura real das maiúsculas, com acento se houver */
  acima: number;
  /** px abaixo da base */
  abaixo: number;
}

/**
 * Altura real de um trecho, medida nos glifos.
 *
 * A altura nominal da fonte não serve para desenhar uma tarja nem para saber se
 * duas linhas vão se tocar: "MILITÂNCIA" ocupa bem mais que "MILITANCIA", e Anton,
 * Oswald, Alfa e Bitter têm proporções diferentes com o mesmo corpo em px.
 * Navegador sem `actualBoundingBox` cai numa estimativa a partir do corpo.
 */
export function extremos(
  ctx: CanvasRenderingContext2D,
  txt: string,
  font: string,
  espaco = 0,
): Extremos {
  ctx.save();
  ctx.font = font;
  if (espaco && "letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${espaco}px`;
  }
  const m = ctx.measureText(txt || "M");
  ctx.restore();

  const corpo = parseFloat(font) || 16;
  const acima = m.actualBoundingBoxAscent;
  const abaixo = m.actualBoundingBoxDescent;

  return typeof acima === "number" && typeof abaixo === "number" && isFinite(acima)
    ? { acima, abaixo: Math.max(0, abaixo) }
    : { acima: corpo * 0.74, abaixo: corpo * 0.24 };
}
