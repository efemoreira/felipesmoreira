/**
 * Gera o PNG de uma peça do mutirão, no canvas.
 *
 * Os traços vêm de `@/lib/cordelCanvas` — os mesmos do pôster da programação —
 * porque as duas peças precisam parecer do mesmo movimento. O que é próprio
 * daqui é só o layout: um número grande, uma frase e a fonte embaixo.
 *
 * Nenhuma peça sai sem a linha de fonte. É a mesma trava da Parte 0 do manual:
 * número sem página é o que a Checagem existe pra barrar.
 */
import { familia, fontesProntas } from "@/lib/fontes";
import { bloco, escrever, icone, pilula, quebrar } from "@/lib/cordelCanvas";
import { C } from "@/lib/theme";
import type { Peca } from "./data";

export type Formato = "9:16" | "3:4";

export const FORMATOS: Record<Formato, { altura: number; rotulo: string }> = {
  "9:16": { altura: 1920, rotulo: "Stories 9:16" },
  "3:4": { altura: 1440, rotulo: "Feed 3:4" },
};

const W = 1080;
const PAD = 84;

/** O fundo das artes: o branco do site com a luz do sol vindo do alto. */
function fundo(ctx: CanvasRenderingContext2D, h: number) {
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, h);

  const brilho = ctx.createRadialGradient(W / 2, 0, 60, W / 2, 0, W * 1.05);
  brilho.addColorStop(0, "rgba(255,203,5,.34)");
  brilho.addColorStop(0.55, "rgba(255,203,5,.08)");
  brilho.addColorStop(1, "rgba(255,203,5,0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, W, h);

  // a faixa de ouro no pé: a assinatura da peça
  ctx.fillStyle = C.gold;
  ctx.fillRect(0, h - 22, W, 22);
}

export async function gerarCartao(peca: Peca, formato: Formato = "9:16"): Promise<HTMLCanvasElement> {
  await fontesProntas();

  const H = FORMATOS[formato].altura;
  const ALFA = familia("--font-alfa", "serif");
  const TEXTO = familia("--font-texto", "sans-serif");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  fundo(ctx, H);

  const larguraUtil = W - PAD * 2;
  const centro = W / 2;

  /* ---- o número é a peça: escolhe o corpo que couber numa linha ---- */
  let corpoNumero = 200;
  let fonteNumero = `${corpoNumero}px ${ALFA}`;
  while (corpoNumero > 96 && medirCom(ctx, peca.numero, fonteNumero) > larguraUtil) {
    corpoNumero -= 8;
    fonteNumero = `${corpoNumero}px ${ALFA}`;
  }

  /* ---- a frase, medida antes pra centralizar o conjunto ---- */
  const fonteFrase = `500 46px ${TEXTO}`;
  const linhasFrase = quebrar(ctx, peca.frase, larguraUtil, fonteFrase, 6);
  const alturaFrase = linhasFrase.length * 62;

  /* A fonte anda **junto** com o conteúdo, não presa no rodapé: a peça circula
     recortada em print, e a página do plano é a parte que não pode se perder no
     corte. Por isso ela entra na conta do bloco centralizado. */
  const alturaFonte = 92;
  const alturaBloco =
    62 /* pílula */ + 52 + corpoNumero * 0.9 + 40 + alturaFrase + 46 + alturaFonte;

  /* Um pouco acima do meio: no 9:16 o terço de baixo fica sob a interface do
     Stories, e no feed o olho entra por cima. */
  let y = Math.max(PAD + 40, (H - alturaBloco) / 2 - H * 0.06);

  /* ---- pílula do tema ---- */
  pilula(ctx, peca.tema.toUpperCase(), centro, y, {
    font: `700 26px ${TEXTO}`,
    fundo: C.gold,
    cor: C.ink,
    espaco: 6,
    padX: 30,
    altura: 62,
  });
  y += 62 + 52;

  /* ---- o número ---- */
  escrever(ctx, peca.numero, centro, y, { font: fonteNumero, cor: C.gold, align: "center" });
  y += corpoNumero * 0.9 + 40;

  /* ---- a frase ---- */
  for (const linha of linhasFrase) {
    escrever(ctx, linha, centro, y, { font: fonteFrase, cor: C.ink, align: "center" });
    y += 62;
  }
  y += 46;

  /* ---- a fonte ---- */
  bloco(ctx, PAD, y, larguraUtil, alturaFonte, C.ouroClaro, {
    sombra: 0,
    borda: C.gold2,
    espessura: 3,
  });
  const larguraFonte = medirCom(ctx, peca.fonte, `700 28px ${TEXTO}`) + 28 * 2 + 52;
  const xFonte = centro - larguraFonte / 2;
  icone(ctx, "book", xFonte + 8, y + alturaFonte / 2 - 16, 32, C.goldDim);
  escrever(ctx, peca.fonte, xFonte + 60, y + alturaFonte / 2 - 17, {
    font: `700 28px ${TEXTO}`,
    cor: C.goldDim,
    espaco: 2,
  });

  /* ---- assinatura, no pé ---- */
  escrever(ctx, "felipesmoreira.com/propostas", centro, H - PAD - 80, {
    font: `700 28px ${TEXTO}`,
    cor: C.ink,
    align: "center",
    espaco: 3,
  });
  escrever(ctx, "MISSÃO CEARÁ", centro, H - PAD - 36, {
    font: `700 24px ${TEXTO}`,
    cor: C.goldDim,
    align: "center",
    espaco: 7,
  });

  return canvas;
}

/** measureText respeitando a fonte pedida, sem sujar o estado do contexto. */
function medirCom(ctx: CanvasRenderingContext2D, txt: string, font: string): number {
  ctx.save();
  ctx.font = font;
  const w = ctx.measureText(txt).width;
  ctx.restore();
  return w;
}

export const nomeArquivo = (peca: Peca, formato: Formato) =>
  `missao-${peca.id}-${formato.replace(":", "x")}.png`;
