/**
 * Gera o PNG da programação da semana no canvas — sem dependências externas.
 * O poster é um layout próprio (não é um "print" da página): sem botão de voltar,
 * sem barra de redes sociais, fundo em cor e moldura de cordel.
 */
import { iconPaths } from "@/components/icons";
import { familia, fontesProntas } from "@/lib/fontes";
import { medir } from "@/lib/textoCanvas";
import {
  bloco,
  canvasParaBlob,
  cortado,
  escrever,
  icone,
  pilula,
  quebrar,
} from "@/lib/cordelCanvas";
import { C, temaDe, sigla, type Agenda, type ItemAgenda } from "./tipos";

export { canvasParaBlob };

/** Formatos verticais aceitos — 9:16 (stories/status) e 3:4 (feed). */
export type Formato = "9:16" | "3:4";

export const FORMATOS: Record<Formato, { altura: number; rotulo: string }> = {
  "9:16": { altura: 1920, rotulo: "Stories 9:16" },
  "3:4": { altura: 1440, rotulo: "Feed 3:4" },
};

const W = 1080; // largura fixa; a altura vem do formato escolhido
const PAD = 64; // margem interna do conteúdo
const MOLDURA = 22; // recuo da moldura dourada

const GAPS = [24, 18]; // aperta o respiro entre cartões antes de esticar o poster
const LINHA_MIN = 108; // cabe título + linha fina com margem
const LINHA_MAX = 214; // agenda curta cresce até aqui

const ASSINATURA = "felipesmoreira.com/programacao";

/* Os traços do cordel — escrever, quebrar, bloco, pilula, icone — moram em
   @/lib/cordelCanvas, porque o kit de compartilhamento desenha os mesmos. */

/** Desenha a imagem cobrindo a área (object-fit: cover). */
function cobrir(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const escala = Math.max(w / img.width, h / img.height);
  const iw = img.width * escala;
  const ih = img.height * escala;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
  ctx.restore();
}

const carregarImagem = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });

/* ===== fundo ===== */
function fundo(ctx: CanvasRenderingContext2D, h: number) {
  // base noite
  ctx.fillStyle = C.night;
  ctx.fillRect(0, 0, W, h);

  // brilho quente no topo (dá profundidade sem competir com os cartões)
  const brilho = ctx.createRadialGradient(W / 2, h * 0.06, 40, W / 2, h * 0.06, W * 0.9);
  brilho.addColorStop(0, "rgba(255,203,5,.20)");
  brilho.addColorStop(0.45, "rgba(184,134,11,.07)");
  brilho.addColorStop(1, "rgba(20,17,12,0)");
  ctx.fillStyle = brilho;
  ctx.fillRect(0, 0, W, h);

  // hachura diagonal discreta (xilogravura)
  ctx.save();
  ctx.strokeStyle = "rgba(255,203,5,.05)";
  ctx.lineWidth = 3;
  for (let i = -h; i < W + h; i += 26) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + h, h);
    ctx.stroke();
  }
  ctx.restore();

  // vinheta inferior
  const vinheta = ctx.createLinearGradient(0, h * 0.6, 0, h);
  vinheta.addColorStop(0, "rgba(12,12,14,0)");
  vinheta.addColorStop(1, "rgba(12,12,14,.55)");
  ctx.fillStyle = vinheta;
  ctx.fillRect(0, h * 0.6, W, h * 0.4);

  // moldura dupla de cordel
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 5;
  ctx.strokeRect(MOLDURA, MOLDURA, W - MOLDURA * 2, h - MOLDURA * 2);
  ctx.strokeStyle = "rgba(255,203,5,.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(MOLDURA + 12, MOLDURA + 12, W - (MOLDURA + 12) * 2, h - (MOLDURA + 12) * 2);
}

/* ===== poster ===== */
export async function gerarPoster(agenda: Agenda, formato: Formato = "9:16"): Promise<HTMLCanvasElement> {
  await fontesProntas();

  const H_MIN = (FORMATOS[formato] ?? FORMATOS["9:16"]).altura;

  const ALFA = familia("--font-alfa", "serif");
  const ELITE = familia("--font-elite", "monospace");
  const BITTER = familia("--font-bitter", "serif");

  const itens = agenda.programacao ?? [];
  const imagens = await Promise.all(
    itens.map((i) => (i.imagem ? carregarImagem(i.imagem) : Promise.resolve(null))),
  );

  // medidor temporário para calcular a altura antes de criar o canvas final
  const regua = document.createElement("canvas").getContext("2d")!;

  const fonteChamada = `32px ${BITTER}`;
  const linhasChamada = agenda.chamada
    ? quebrar(regua, agenda.chamada, W - PAD * 2 - 80, fonteChamada, 2)
    : [];

  const alturaCabecalho =
    112 + // topo até a pílula
    52 +
    28 + // pílula kicker + respiro
    96 + // título
    (agenda.periodo ? 60 + 22 : 0) +
    (linhasChamada.length ? linhasChamada.length * 42 + 14 : 0) +
    38;

  const alturaRodape = 176;

  /* Altura das linhas: ocupa o espaço vertical disponível do formato.
     Se a agenda for longa demais, o poster cresce (continua vertical). */
  const n = itens.length;
  const espacoLivre = H_MIN - alturaCabecalho - alturaRodape;
  let LINHA_GAP = GAPS[0];
  let LINHA_H = 0;
  for (const gap of GAPS) {
    const bruta = n ? (espacoLivre - (n - 1) * gap) / n : 0;
    LINHA_GAP = gap;
    LINHA_H = n ? Math.round(Math.min(LINHA_MAX, Math.max(LINHA_MIN, bruta))) : 0;
    if (bruta >= LINHA_MIN) break;
  }
  const alturaLista = n ? n * (LINHA_H + LINHA_GAP) - LINHA_GAP : 120;
  const H = Math.round(Math.max(H_MIN, alturaCabecalho + alturaLista + alturaRodape));
  // sobra vertical vira respiro extra antes da lista (mantém o bloco centrado)
  const respiro = Math.max(0, Math.round((H - alturaCabecalho - alturaLista - alturaRodape) / 2));

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  fundo(ctx, H);

  /* ----- cabeçalho ----- */
  let y = 112;
  const cx = W / 2;

  y += pilula(ctx, "MISSÃO CEARÁ", cx, y, {
    font: `24px ${ELITE}`,
    fundo: C.gold,
    cor: C.ink,
    espaco: 6,
    padX: 26,
    altura: 52,
  });
  y += 28;

  // título: primeira palavra em ouro, resto em creme — encolhe até caber
  const partes = agenda.titulo.trim().split(" ");
  const t1 = (partes[0] ?? agenda.titulo).toUpperCase();
  const t2 = partes.slice(1).join(" ").toUpperCase();
  let tamTitulo = 80;
  const espTitulo = 5;
  const maxTitulo = W - PAD * 2 - 40;
  let fonteTitulo = `${tamTitulo}px ${ALFA}`;
  while (
    tamTitulo > 40 &&
    medir(ctx, t2 ? `${t1} ${t2}` : t1, fonteTitulo, espTitulo) > maxTitulo
  ) {
    tamTitulo -= 3;
    fonteTitulo = `${tamTitulo}px ${ALFA}`;
  }
  const larg1 = medir(ctx, t1, fonteTitulo, espTitulo);
  const largEspaco = medir(ctx, " ", fonteTitulo, espTitulo);
  const larg2 = t2 ? medir(ctx, t2, fonteTitulo, espTitulo) : 0;
  const inicio = cx - (larg1 + (t2 ? largEspaco + larg2 : 0)) / 2;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.55)";
  ctx.shadowOffsetX = 5;
  ctx.shadowOffsetY = 5;
  escrever(ctx, t1, inicio, y, { font: fonteTitulo, cor: C.gold, espaco: espTitulo });
  if (t2) {
    escrever(ctx, t2, inicio + larg1 + largEspaco, y, {
      font: fonteTitulo,
      cor: C.cream,
      espaco: espTitulo,
    });
  }
  ctx.restore();
  y += tamTitulo + 26;

  if (agenda.periodo) {
    y += pilula(ctx, agenda.periodo.toUpperCase(), cx, y, {
      font: `26px ${ELITE}`,
      fundo: C.gold,
      cor: C.ink,
      espaco: 5,
      padX: 24,
      altura: 60,
    });
    y += 22;
  }

  for (const linha of linhasChamada) {
    escrever(ctx, linha, cx, y, { font: fonteChamada, cor: "rgba(246,245,239,.88)", align: "center" });
    y += 42;
  }
  if (linhasChamada.length) y += 14;
  y += 38;

  /* ----- cartões ----- */
  y += respiro;

  if (!itens.length) {
    escrever(ctx, "AGENDA EM BREVE", cx, y + 30, {
      font: `34px ${ELITE}`,
      cor: C.cream,
      align: "center",
      espaco: 4,
    });
  }

  itens.forEach((item, i) => {
    desenharCartao(ctx, item, imagens[i], PAD, y, W - PAD * 2, LINHA_H, { ALFA, ELITE, BITTER });
    y += LINHA_H + LINHA_GAP;
  });

  /* ----- rodapé ----- */
  const rodapeY = H - alturaRodape + 40;
  ctx.strokeStyle = "rgba(255,203,5,.45)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(PAD + 60, rodapeY);
  ctx.lineTo(W - PAD - 60, rodapeY);
  ctx.stroke();

  escrever(ctx, ASSINATURA.toUpperCase(), cx, rodapeY + 30, {
    font: `30px ${ELITE}`,
    cor: C.gold,
    align: "center",
    espaco: 4,
  });

  return canvas;
}

/* ===== um cartão do poster ===== */
function desenharCartao(
  ctx: CanvasRenderingContext2D,
  item: ItemAgenda,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  w: number,
  h: number,
  fontes: { ALFA: string; ELITE: string; BITTER: string },
) {
  const { ALFA, ELITE, BITTER } = fontes;
  const tema = temaDe(item.cor);

  let preenchimento: string | CanvasGradient = tema.canvas[0];
  if (tema.canvas.length > 1) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, tema.canvas[0]);
    g.addColorStop(1, tema.canvas[1]);
    preenchimento = g;
  }

  bloco(ctx, x, y, w, h, preenchimento, { sombra: 11, espessura: 5 });

  /* escala tipográfica acompanha a altura da linha */
  const g = h >= 180 ? 1.12 : 1;

  /* miniatura — sempre 16:9, sem roubar espaço da coluna de texto */
  const THUMB_H = Math.round(Math.min(h - 34, 118));
  const THUMB_W = Math.round((THUMB_H * 16) / 9);
  const tX = x + 16;
  const tY = y + (h - THUMB_H) / 2;
  ctx.fillStyle = C.night;
  ctx.fillRect(tX, tY, THUMB_W, THUMB_H);

  if (img) {
    cobrir(ctx, img, tX, tY, THUMB_W, THUMB_H);
  } else {
    // mesmo placeholder hachurado da página, com a sigla do dia
    ctx.save();
    ctx.beginPath();
    ctx.rect(tX, tY, THUMB_W, THUMB_H);
    ctx.clip();
    ctx.strokeStyle = "rgba(255,203,5,.18)";
    ctx.lineWidth = 8;
    for (let i = -THUMB_H; i < THUMB_W + THUMB_H; i += 16) {
      ctx.beginPath();
      ctx.moveTo(tX + i, tY);
      ctx.lineTo(tX + i - THUMB_H, tY + THUMB_H);
      ctx.stroke();
    }
    ctx.restore();
    const corpoSigla = Math.round(Math.min(44 * g, THUMB_H * 0.62));
    escrever(ctx, sigla(item.dia), tX + THUMB_W / 2, tY + (THUMB_H - corpoSigla * 1.2) / 2, {
      font: `${corpoSigla}px ${ALFA}`,
      cor: C.gold,
      align: "center",
      espaco: 3,
    });
  }
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 3;
  ctx.strokeRect(tX, tY, THUMB_W, THUMB_H);

  /* a etiqueta "AO VIVO" fica só na página — no PNG ela roubava a miniatura */

  /* bloco da direita: data · hora + dia da semana */
  const seloL = Math.round(58 * g);
  const dirFim = x + w - 16;
  const seloX = dirFim - seloL;
  const temSelo = !!item.plataforma && !!(iconPaths as Record<string, string[]>)[item.plataforma];

  const fonteData = `${Math.round(22 * g)}px ${ELITE}`;
  const fonteDia = `${Math.round(34 * g)}px ${ALFA}`;
  const dataTxt = item.hora ? `${item.data} · ${item.hora}` : item.data;
  const diaTxt = item.dia.toUpperCase();
  const metaW = Math.max(medir(ctx, dataTxt, fonteData, 2), medir(ctx, diaTxt, fonteDia, 2));
  const metaDir = temSelo ? seloX - 20 : dirFim;
  const metaEsq = metaDir - metaW;

  escrever(ctx, dataTxt, metaDir, y + h / 2 - 32 * g, {
    font: fonteData,
    cor: tema.fg,
    align: "right",
    espaco: 2,
  });
  escrever(ctx, diaTxt, metaDir, y + h / 2 + 2, {
    font: fonteDia,
    cor: tema.fg,
    align: "right",
    espaco: 2,
  });

  // divisória vertical
  ctx.strokeStyle = tema.claro ? "rgba(246,245,239,.32)" : "rgba(24,18,3,.3)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(metaEsq - 22, y + 26);
  ctx.lineTo(metaEsq - 22, y + h - 26);
  ctx.stroke();

  /* selo da plataforma */
  if (temSelo) {
    const sY = y + (h - seloL) / 2;
    bloco(ctx, seloX, sY, seloL, seloL, tema.badge, { sombra: 5, espessura: 3, raio: 14 });
    icone(ctx, item.plataforma!, seloX + 14, sY + 14, 30, tema.badgeFg);
  }

  /* título + subtítulo */
  const txtX = tX + THUMB_W + 22;
  const txtW = metaEsq - 36 - txtX;
  const alturaSub = 32;
  const tituloTxt = item.titulo.toUpperCase();

  /* O bloco nunca encosta na borda do cartão: reserva uma margem vertical mínima
     e, se não couber, abre mão do subtítulo antes de espremer o título. */
  const margemV = h >= 180 ? 26 : 18;
  const disponivel = h - margemV * 2;
  const maxLinhas = Math.max(1, Math.min(2, Math.floor(disponivel / Math.round(40 * g))));

  /* O corpo cede alguns pontos para o texto caber inteiro — melhor que reticências. */
  let corpoTitulo = Math.round(32 * g);
  let linhas = quebrar(ctx, tituloTxt, txtW, `${corpoTitulo}px ${ALFA}`, maxLinhas, 1);
  while (corpoTitulo > 25 && cortado(linhas)) {
    corpoTitulo -= 1;
    linhas = quebrar(ctx, tituloTxt, txtW, `${corpoTitulo}px ${ALFA}`, maxLinhas, 1);
  }
  const fonteTitulo = `${corpoTitulo}px ${ALFA}`;
  const alturaLinha = Math.round(corpoTitulo * 1.25);

  const cabe = (nLinhas: number, comSub: boolean) =>
    nLinhas * alturaLinha + (comSub ? alturaSub : 0) <= disponivel;

  let corpoSub = 22;
  let sub = item.subtitulo ? quebrar(ctx, item.subtitulo, txtW, `${corpoSub}px ${BITTER}`, 1) : [];
  while (item.subtitulo && corpoSub > 17 && cortado(sub)) {
    corpoSub -= 1;
    sub = quebrar(ctx, item.subtitulo, txtW, `${corpoSub}px ${BITTER}`, 1);
  }
  const fonteSub = `${corpoSub}px ${BITTER}`;

  if (!cabe(linhas.length, sub.length > 0)) {
    if (cabe(linhas.length, false)) {
      sub = []; // título inteiro vale mais que a linha fina
    } else {
      linhas = quebrar(ctx, tituloTxt, txtW, fonteTitulo, 1, 1);
      if (!cabe(1, sub.length > 0)) sub = [];
    }
  }

  const alturaTexto = linhas.length * alturaLinha + (sub.length ? alturaSub : 0);
  let ty = y + (h - alturaTexto) / 2 - 2;
  for (const linha of linhas) {
    escrever(ctx, linha, txtX, ty, { font: fonteTitulo, cor: tema.fg, espaco: 1 });
    ty += alturaLinha;
  }
  if (sub.length) {
    escrever(ctx, sub[0], txtX, ty + 6, { font: fonteSub, cor: tema.sub });
  }
}

/* ===== exportação ===== */
export const nomeArquivo = (formato: Formato) =>
  `agenda-da-semana-${formato.replace(":", "x")}.png`;
