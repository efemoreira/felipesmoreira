/**
 * Os traços do cordel no canvas — borda grossa, sombra dura deslocada, pílula
 * de caixa-alta espaçada, ícone em Path2D.
 *
 * Nasceu dentro do pôster da programação. Mudou de casa quando o kit de
 * compartilhamento passou a desenhar as mesmas peças: duas cópias do mesmo
 * `bloco()` divergiriam na primeira vez que alguém mexesse na espessura da
 * borda, e aí o cartão do kit deixaria de parecer do mesmo movimento que o
 * pôster da agenda.
 *
 * O que **não** mora aqui é o que é específico de cada peça: fundo, layout e
 * a montagem. Só o traço é comum.
 */
import { iconPaths } from "@/components/icons";
import { medir } from "@/lib/textoCanvas";
import { C } from "@/lib/theme";

export type OpcoesTexto = {
  font: string;
  cor: string;
  align?: CanvasTextAlign;
  /** letter-spacing em px */
  espaco?: number;
};

export function escrever(
  ctx: CanvasRenderingContext2D,
  txt: string,
  x: number,
  y: number,
  o: OpcoesTexto,
) {
  ctx.save();
  ctx.font = o.font;
  ctx.fillStyle = o.cor;
  ctx.textAlign = o.align ?? "left";
  ctx.textBaseline = "top";
  if (o.espaco && "letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${o.espaco}px`;
  }
  ctx.fillText(txt, x, y);
  ctx.restore();
}

/** Verdadeiro quando `quebrar` teve que cortar — quem chama decide se encolhe a fonte. */
export const cortado = (linhas: string[]) => linhas[linhas.length - 1]?.endsWith("…") ?? false;

/** Quebra o texto em até `maxLinhas`, cortando com reticências no excedente. */
export function quebrar(
  ctx: CanvasRenderingContext2D,
  txt: string,
  maxW: number,
  font: string,
  maxLinhas: number,
  espaco = 0,
): string[] {
  const palavras = txt.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";

  for (const p of palavras) {
    const teste = atual ? `${atual} ${p}` : p;
    if (medir(ctx, teste, font, espaco) <= maxW || !atual) {
      atual = teste;
    } else {
      linhas.push(atual);
      atual = p;
      if (linhas.length === maxLinhas) break;
    }
  }
  if (linhas.length < maxLinhas && atual) linhas.push(atual);

  // se sobrou texto, corta a última linha com reticências
  const usadas = linhas.join(" ");
  if (usadas.replace(/\s+/g, " ") !== txt.replace(/\s+/g, " ").trim()) {
    let ultima = linhas[linhas.length - 1] ?? "";
    while (ultima && medir(ctx, `${ultima}…`, font, espaco) > maxW) {
      ultima = ultima.slice(0, -1).trimEnd();
    }
    linhas[linhas.length - 1] = `${ultima}…`;
  }
  return linhas;
}

export function retangulo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r = 0,
) {
  ctx.beginPath();
  if (r > 0 && typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
}

/** Bloco de cordel: sombra dura deslocada + preenchimento + borda ink. */
export function bloco(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  preenchimento: string | CanvasGradient,
  opcoes: { sombra?: number; borda?: string; espessura?: number; raio?: number } = {},
) {
  const { sombra = 10, borda = C.ink, espessura = 5, raio = 0 } = opcoes;
  if (sombra > 0) {
    ctx.fillStyle = "rgba(0,0,0,.45)";
    retangulo(ctx, x + sombra, y + sombra, w, h, raio);
    ctx.fill();
  }
  ctx.fillStyle = preenchimento;
  retangulo(ctx, x, y, w, h, raio);
  ctx.fill();
  if (espessura > 0) {
    ctx.strokeStyle = borda;
    ctx.lineWidth = espessura;
    retangulo(ctx, x, y, w, h, raio);
    ctx.stroke();
  }
}

/** Pílula com texto em caixa-alta espaçada (mesmo tratamento dos kickers do site). */
export function pilula(
  ctx: CanvasRenderingContext2D,
  txt: string,
  cx: number,
  y: number,
  o: { font: string; fundo: string; cor: string; espaco: number; padX: number; altura: number },
): number {
  const larguraTexto = medir(ctx, txt, o.font, o.espaco);
  const w = larguraTexto + o.padX * 2;
  const x = cx - w / 2;
  bloco(ctx, x, y, w, o.altura, o.fundo, { sombra: 6, espessura: 3 });
  escrever(ctx, txt, cx + o.espaco / 2, y + (o.altura - parseInt(o.font, 10) * 1.15) / 2 + 2, {
    font: o.font,
    cor: o.cor,
    align: "center",
    espaco: o.espaco,
  });
  return o.altura;
}

/** Ícone Tabler (24×24) desenhado com Path2D. */
export function icone(
  ctx: CanvasRenderingContext2D,
  nome: string,
  x: number,
  y: number,
  tamanho: number,
  cor: string,
) {
  const traços = (iconPaths as Record<string, string[]>)[nome];
  if (!traços) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(tamanho / 24, tamanho / 24);
  ctx.strokeStyle = cor;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of traços) ctx.stroke(new Path2D(d));
  ctx.restore();
}

export const canvasParaBlob = (canvas: HTMLCanvasElement): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
