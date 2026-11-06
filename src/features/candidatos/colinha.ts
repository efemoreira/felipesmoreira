/**
 * A colinha, no canvas — o papelzinho que o eleitor leva para a urna.
 *
 * Os traços vêm de `@/lib/cordelCanvas`, os mesmos do pôster da programação e
 * das peças da Munição, porque as três precisam parecer do mesmo movimento. O
 * que é próprio daqui é o layout: **o número é a peça**. Nome, cargo e @ são
 * contexto; o que a pessoa tem de conseguir ler de longe, e lembrar na cabine,
 * é a sequência de dígitos.
 *
 * Duas artes, e não uma:
 *   - `gerarFicha`  — um candidato, número gigante, para story;
 *   - `gerarColinha` — um grupo inteiro, uma linha por pessoa, para o print
 *     que se guarda na galeria.
 */
import { familia, fontesProntas } from "@/lib/fontes";
import { bloco, escrever, pilula, quebrar } from "@/lib/cordelCanvas";
import { C } from "@/lib/theme";
import type { Candidato } from "@/lib/api/candidatos";

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

function assinar(ctx: CanvasRenderingContext2D, h: number, texto: string) {
  escrever(ctx, "felipesmoreira.com/candidatos", W / 2, h - PAD - 80, {
    font: `600 28px ${texto}`,
    cor: C.ink,
    align: "center",
    espaco: 3,
  });
  escrever(ctx, "MISSÃO CEARÁ", W / 2, h - PAD - 36, {
    font: `800 24px ${texto}`,
    cor: C.goldDim,
    align: "center",
    espaco: 7,
  });
}

/** measureText respeitando a fonte pedida, sem sujar o estado do contexto. */
function medirCom(ctx: CanvasRenderingContext2D, txt: string, font: string): number {
  ctx.save();
  ctx.font = font;
  const w = ctx.measureText(txt).width;
  ctx.restore();
  return w;
}

/**
 * Carrega a foto do candidato, ou devolve null.
 *
 * Null e não exceção: a foto é enfeite, o número é a peça. Uma imagem que não
 * carrega (arquivo apagado, rede caindo) não pode impedir a arte de sair — o
 * militante está no meio do mutirão e precisa da peça, com ou sem rosto.
 */
function carregarFoto(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    /* Mesma origem (a foto vem de /dados/imagens), mas declarar é o que garante
       que o canvas não fique "sujo" e o toBlob continue funcionando. */
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Desenha a foto cortada num círculo, com a moldura do cordel. */
function retrato(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  raio: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  /* Cobre o círculo sem distorcer: escala pelo lado menor e centraliza. */
  const escala = Math.max((raio * 2) / img.width, (raio * 2) / img.height);
  const l = img.width * escala;
  const a = img.height * escala;
  ctx.drawImage(img, cx - l / 2, cy - a / 2, l, a);
  ctx.restore();

  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.stroke();
}

/* ===================== um candidato ===================== */

export async function gerarFicha(c: Candidato): Promise<HTMLCanvasElement> {
  await fontesProntas();

  const H = 1920;
  const ALFA = familia("--font-alfa", "serif");
  const TEXTO = familia("--font-texto", "sans-serif");

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  fundo(ctx, H);

  const larguraUtil = W - PAD * 2;
  const centro = W / 2;

  /* O número escolhe o corpo que couber numa linha só. Quebrar um número em
     duas linhas é entregar dois números diferentes para quem lê rápido. */
  let corpo = 260;
  while (corpo > 120 && medirCom(ctx, c.numero, `${corpo}px ${ALFA}`) > larguraUtil) {
    corpo -= 10;
  }

  const foto = await carregarFoto(c.imagem);
  const RAIO = 190;
  const alturaFoto = foto ? RAIO * 2 + 54 : 0;

  const linhasNome = quebrar(ctx, c.nome, larguraUtil, `58px ${ALFA}`, 2);
  const alturaBloco =
    alturaFoto + 62 + 46 + corpo * 0.9 + 48 + linhasNome.length * 74 + 40 + 44;
  let y = Math.max(PAD + 40, (H - alturaBloco) / 2 - H * 0.06);

  if (foto) {
    retrato(ctx, foto, centro, y + RAIO, RAIO);
    y += alturaFoto;
  }

  if (c.cargo) {
    pilula(ctx, c.cargo.toUpperCase(), centro, y, {
      font: `700 26px ${TEXTO}`,
      fundo: C.gold,
      cor: C.ink,
      espaco: 6,
      padX: 30,
      altura: 62,
    });
  }
  y += 62 + 46;

  escrever(ctx, c.numero, centro, y, { font: `${corpo}px ${ALFA}`, cor: C.gold, align: "center" });
  y += corpo * 0.9 + 48;

  for (const linha of linhasNome) {
    escrever(ctx, linha, centro, y, { font: `58px ${ALFA}`, cor: C.ink, align: "center" });
    y += 74;
  }
  y += 40;

  if (c.instagram) {
    escrever(ctx, `@${c.instagram}`, centro, y, {
      font: `500 34px ${TEXTO}`,
      cor: C.goldDim,
      align: "center",
    });
  }

  assinar(ctx, H, TEXTO);
  return canvas;
}

/* ===================== a colinha de um grupo ===================== */

/**
 * Uma linha por candidato, o número à esquerda e o nome à direita.
 *
 * A altura é calculada a partir de quantos cabem: colinha é para guardar na
 * galeria e abrir na fila da urna, então nada de cortar a lista para caber num
 * formato fixo. O limite prático é a legibilidade — abaixo de certa altura de
 * linha o número deixa de ser lido de relance, e aí é melhor mandar duas artes.
 */
export const CABEM_POR_ARTE = 8;

export async function gerarColinha(
  titulo: string,
  candidatos: Candidato[],
): Promise<HTMLCanvasElement> {
  await fontesProntas();

  const ALFA = familia("--font-alfa", "serif");
  const TEXTO = familia("--font-texto", "sans-serif");

  const lista = candidatos.slice(0, CABEM_POR_ARTE);
  const ALTURA_LINHA = 150;
  const TOPO = 300;
  const H = Math.max(1350, TOPO + lista.length * ALTURA_LINHA + 260);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  fundo(ctx, H);

  const larguraUtil = W - PAD * 2;
  const centro = W / 2;

  escrever(ctx, "COLINHA", centro, PAD + 40, {
    font: `700 28px ${TEXTO}`,
    cor: C.goldDim,
    align: "center",
    espaco: 8,
  });
  escrever(ctx, titulo, centro, PAD + 96, {
    font: `62px ${ALFA}`,
    cor: C.cream,
    align: "center",
  });

  let y = TOPO;
  for (const c of lista) {
    bloco(ctx, PAD, y, larguraUtil, ALTURA_LINHA - 22, C.ouroClaro, {
      sombra: 0,
      borda: C.gold2,
      espessura: 3,
    });

    /* O número é o que a pessoa digita: fica na esquerda, grande, alinhado —
       a coluna de dígitos é o que faz a colinha ser lida de relance. */
    escrever(ctx, c.numero, PAD + 30, y + 26, { font: `74px ${ALFA}`, cor: C.gold });

    const xNome = PAD + 30 + 250;
    const largura = larguraUtil - 250 - 60;
    const [nome] = quebrar(ctx, c.nome, largura, `40px ${ALFA}`, 1);
    escrever(ctx, nome, xNome, y + 30, { font: `40px ${ALFA}`, cor: C.ink });

    /* O cargo, e não o @: a colinha é lida de cima para baixo como a cédula,
       e é o cargo que diz em que tela da urna aquele número entra. */
    const abaixo = [c.cargo, c.partido].filter(Boolean).join("  ·  ");
    if (abaixo) {
      escrever(ctx, abaixo, xNome, y + 80, { font: `500 28px ${TEXTO}`, cor: C.suave });
    }
    y += ALTURA_LINHA;
  }

  assinar(ctx, H, TEXTO);
  return canvas;
}

export const nomeArquivoFicha = (c: Candidato) => `missao-${c.numero}-${c.id}.png`;
export const nomeArquivoColinha = (grupo: string) => `missao-colinha-${grupo}.png`;
