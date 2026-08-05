/**
 * Texto com cor por palavra — o que o `Konva.Text` não faz.
 *
 * Nas referências o título quase nunca é de uma cor só: parte fica em ouro,
 * parte em branco, e um pedaço vem sobre uma tarja amarela. Então a camada de
 * texto é um `Konva.Shape` com desenho próprio e uma marcação curta:
 *
 *   URGENTE!              → cor base
 *   *APROVA PROJETO*      → cor de destaque
 *   ==PROPAGANDA==        → tarja (fundo colorido, texto escuro)
 */
import { medir } from "@/lib/textoCanvas";
import { familia } from "@/lib/fontes";
import { FONTES } from "./paleta";
import type { CamadaTexto } from "./tipos";

export type Estilo = "base" | "destaque" | "tarja";

export interface Palavra {
  texto: string;
  estilo: Estilo;
}

export interface Linha {
  palavras: Palavra[];
  largura: number;
}

export interface TextoMedido {
  linhas: Linha[];
  largura: number;
  altura: number;
  /** corpo realmente usado — menor que o pedido quando o auto-ajuste entra */
  tamanho: number;
  alturaLinha: number;
}

const PAD_TARJA_X = 0.16; // fração do corpo, de cada lado
const PAD_TARJA_Y = 0.1;

/* ===== medição fora da árvore do Konva ===== */
let pincel: CanvasRenderingContext2D | null = null;

function contexto(): CanvasRenderingContext2D {
  if (!pincel) {
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    pincel = canvas.getContext("2d")!;
  }
  return pincel;
}

/** Contêiner que carrega as CSS vars das fontes do estúdio (ver page.tsx). */
const raiz = () => document.getElementById("estudio-raiz");

export function fonteCss(camada: CamadaTexto, tamanho = camada.tamanho): string {
  const { variavel, reserva } = FONTES[camada.fonte] ?? FONTES.anton;
  return `${tamanho}px ${familia(variavel, reserva, raiz())}`;
}

/* ===== marcação ===== */

/** Divide o texto cru em palavras já com o estilo de cada uma. */
export function analisar(cru: string, caixaAlta: boolean): Palavra[][] {
  const fonte = caixaAlta ? cru.toLocaleUpperCase("pt-BR") : cru;

  return fonte.split("\n").map((linha) => {
    const palavras: Palavra[] = [];
    // captura ==tarja== e *destaque*; o resto cai no grupo do texto solto
    const padrao = /==([^=]+)==|\*([^*]+)\*|([^=*]+|[=*])/g;

    for (const achado of linha.matchAll(padrao)) {
      const [, tarja, destaque, solto] = achado;
      const trecho = tarja ?? destaque ?? solto ?? "";
      const estilo: Estilo = tarja ? "tarja" : destaque ? "destaque" : "base";
      for (const p of trecho.split(/\s+/).filter(Boolean)) {
        palavras.push({ texto: p, estilo });
      }
    }
    return palavras;
  });
}

/* ===== medição e quebra ===== */

function quebrarPalavras(
  ctx: CanvasRenderingContext2D,
  palavras: Palavra[],
  maxW: number,
  font: string,
  espaco: number,
): Linha[] {
  if (!palavras.length) return [{ palavras: [], largura: 0 }];

  const larguraEspaco = medir(ctx, " ", font, espaco);
  const linhas: Linha[] = [];
  let atual: Palavra[] = [];
  let largura = 0;

  for (const palavra of palavras) {
    const w = medir(ctx, palavra.texto, font, espaco);
    const comEspaco = atual.length ? largura + larguraEspaco + w : w;

    if (atual.length && comEspaco > maxW) {
      linhas.push({ palavras: atual, largura });
      atual = [palavra];
      largura = w;
    } else {
      atual.push(palavra);
      largura = comEspaco;
    }
  }
  if (atual.length) linhas.push({ palavras: atual, largura });
  return linhas;
}

/**
 * Quebra e mede o texto. Com `autoAjuste`, encolhe o corpo até a maior linha
 * caber na largura da caixa — evita o título vazar sem ninguém perceber.
 */
export function medirTexto(camada: CamadaTexto): TextoMedido {
  const ctx = contexto();
  const paragrafos = analisar(camada.texto, camada.caixaAlta);
  const maxW = Math.max(1, camada.largura);

  let tamanho = camada.tamanho;
  let linhas: Linha[] = [];

  for (let tentativa = 0; tentativa < 24; tentativa++) {
    const font = fonteCss(camada, tamanho);
    const espaco = camada.espacamento * (tamanho / camada.tamanho || 1);

    linhas = paragrafos.flatMap((palavras) =>
      quebrarPalavras(ctx, palavras, maxW, font, espaco),
    );

    const estoura = linhas.some((l) => l.largura > maxW + 0.5);
    if (!estoura || !camada.autoAjuste || tamanho <= 12) break;
    tamanho = Math.max(12, Math.round(tamanho * 0.94));
  }

  const alturaLinha = tamanho * camada.entrelinha;
  return {
    linhas,
    largura: maxW,
    altura: Math.max(alturaLinha, linhas.length * alturaLinha),
    tamanho,
    alturaLinha,
  };
}

/* ===== desenho ===== */

interface Colocada extends Palavra {
  x: number;
  largura: number;
}

/** Posiciona as palavras de uma linha conforme o alinhamento. */
function colocar(
  ctx: CanvasRenderingContext2D,
  linha: Linha,
  camada: CamadaTexto,
  font: string,
  espaco: number,
  maxW: number,
): Colocada[] {
  const larguraEspaco = medir(ctx, " ", font, espaco);
  const sobra = maxW - linha.largura;
  let x = camada.alinhamento === "center" ? sobra / 2 : camada.alinhamento === "right" ? sobra : 0;

  return linha.palavras.map((p) => {
    const largura = medir(ctx, p.texto, font, espaco);
    const posta = { ...p, x, largura };
    x += largura + larguraEspaco;
    return posta;
  });
}

/** Junta palavras de tarja vizinhas numa faixa só, como nas referências. */
function faixas(postas: Colocada[]): { x: number; largura: number }[] {
  const grupos: { x: number; largura: number }[] = [];
  let inicio: Colocada | null = null;
  let fim: Colocada | null = null;

  for (const p of postas) {
    if (p.estilo === "tarja") {
      if (!inicio) inicio = p;
      fim = p;
    } else if (inicio && fim) {
      grupos.push({ x: inicio.x, largura: fim.x + fim.largura - inicio.x });
      inicio = fim = null;
    }
  }
  if (inicio && fim) grupos.push({ x: inicio.x, largura: fim.x + fim.largura - inicio.x });
  return grupos;
}

const corDe = (p: Palavra, c: CamadaTexto) =>
  p.estilo === "tarja" ? c.corTextoTarja : p.estilo === "destaque" ? c.corDestaque : c.cor;

/**
 * Desenha o texto no contexto 2D nativo, com a origem no canto superior
 * esquerdo da caixa. Ordem: sombra dura → tarjas → palavras.
 */
export function desenharTexto(
  ctx: CanvasRenderingContext2D,
  camada: CamadaTexto,
  medida: TextoMedido,
) {
  const { linhas, tamanho, alturaLinha, largura: maxW } = medida;
  const font = fonteCss(camada, tamanho);
  const espaco = camada.espacamento * (tamanho / camada.tamanho || 1);
  const padX = tamanho * PAD_TARJA_X;
  const padY = tamanho * PAD_TARJA_Y;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${espaco}px`;
  }

  linhas.forEach((linha, i) => {
    const meio = i * alturaLinha + alturaLinha / 2;
    const postas = colocar(ctx, linha, camada, font, espaco, maxW);
    const bandas = faixas(postas);
    const topoTarja = meio - tamanho * 0.62 - padY;
    const alturaTarja = tamanho * 1.24 + padY * 2;

    // 1. sombra dura: tarjas e palavras deslocadas, tudo na cor da sombra
    if (camada.sombra.ativa) {
      ctx.save();
      ctx.translate(camada.sombra.x, camada.sombra.y);
      ctx.filter = camada.sombra.desfoque > 0 ? `blur(${camada.sombra.desfoque}px)` : "none";
      ctx.fillStyle = camada.sombra.cor;
      for (const b of bandas) ctx.fillRect(b.x - padX, topoTarja, b.largura + padX * 2, alturaTarja);
      for (const p of postas) {
        if (p.estilo !== "tarja") ctx.fillText(p.texto, p.x, meio);
      }
      ctx.restore();
    }

    // 2. tarjas
    ctx.fillStyle = camada.corTarja;
    for (const b of bandas) ctx.fillRect(b.x - padX, topoTarja, b.largura + padX * 2, alturaTarja);

    // 3. palavras
    for (const p of postas) {
      if (camada.contorno.ativo && camada.contorno.espessura > 0) {
        ctx.lineWidth = camada.contorno.espessura;
        ctx.strokeStyle = camada.contorno.cor;
        ctx.lineJoin = "round";
        ctx.miterLimit = 2;
        ctx.strokeText(p.texto, p.x, meio);
      }
      ctx.fillStyle = corDe(p, camada);
      ctx.fillText(p.texto, p.x, meio);
    }
  });

  ctx.restore();
}
