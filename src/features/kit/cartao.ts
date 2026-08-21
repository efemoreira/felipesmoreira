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
const MOLDURA = 26;

/** Fundo noite com o brilho quente do cordel, igual ao do pôster. */
function fundo(ctx: CanvasRenderingContext2D, h: number) {
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, W, h);

  const brilho = ctx.createRadialGradient(W / 2, h * 0.28, 60, W / 2, h * 0.28, W * 1.05);
  brilho.addColorStop(0, "rgba(255,203,5,.22)");
  brilho.addColorStop(0.45, "rgba(184,134,11,.08)");
  brilho.addColorStop(1, "rgba(20,17,12,0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, W, h);

  // moldura dupla: ouro por fora, tinta por dentro
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 6;
  ctx.strokeRect(MOLDURA, MOLDURA, W - MOLDURA * 2, h - MOLDURA * 2);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(MOLDURA + 13, MOLDURA + 13, W - (MOLDURA + 13) * 2, h - (MOLDURA + 13) * 2);
}

export async function gerarCartao(peca: Peca, formato: Formato = "9:16"): Promise<HTMLCanvasElement> {
  await fontesProntas();

  const H = FORMATOS[formato].altura;
  const ALFA = familia("--font-alfa", "serif");
  const ELITE = familia("--font-elite", "monospace");
  const BITTER = familia("--font-bitter", "serif");

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
  const fonteFrase = `46px ${BITTER}`;
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
    font: `26px ${ELITE}`,
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
    escrever(ctx, linha, centro, y, { font: fonteFrase, cor: C.cream, align: "center" });
    y += 62;
  }
  y += 46;

  /* ---- a fonte ---- */
  bloco(ctx, PAD, y, larguraUtil, alturaFonte, "rgba(255,203,5,.10)", {
    sombra: 0,
    borda: C.gold2,
    espessura: 3,
  });
  const larguraFonte = medirCom(ctx, peca.fonte, `28px ${ELITE}`) + 28 * 2 + 52;
  const xFonte = centro - larguraFonte / 2;
  icone(ctx, "book", xFonte + 8, y + alturaFonte / 2 - 16, 32, C.gold2);
  escrever(ctx, peca.fonte, xFonte + 60, y + alturaFonte / 2 - 17, {
    font: `28px ${ELITE}`,
    cor: C.gold2,
    espaco: 2,
  });

  /* ---- assinatura, no pé ---- */
  escrever(ctx, "felipesmoreira.com/propostas", centro, H - PAD - 80, {
    font: `28px ${ELITE}`,
    cor: C.cream,
    align: "center",
    espaco: 3,
  });
  escrever(ctx, "MISSÃO CEARÁ", centro, H - PAD - 36, {
    font: `24px ${ELITE}`,
    cor: C.gold2,
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
