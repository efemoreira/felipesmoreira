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
 *
 * Além da tarja por palavra existe o **fundo da camada**: uma caixa atrás do
 * texto inteiro (bloco único ou faixa por linha), que é o que dá leitura quando
 * o texto cai em cima de uma foto.
 */
import { extremos, medir } from "@/lib/textoCanvas";
import { familia } from "@/lib/fontes";
import { FONTES } from "./paleta";
import type { AcabamentoTarja, CamadaTexto } from "./tipos";

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
  /**
   * Entrelinha em px que as linhas precisariam para não se tocarem, medida nos
   * glifos de verdade. É o que denuncia o "Â" encostando na linha de cima.
   */
  alturaMinima: number;
}

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

  /* a linha mais "alta" do bloco define o mínimo para nenhuma encostar na outra */
  const fonteFinal = fonteCss(camada, tamanho);
  const espacoFinal = camada.espacamento * (tamanho / camada.tamanho || 1);
  let alturaMinima = 0;
  for (const l of linhas) {
    const txt = l.palavras.map((p) => p.texto).join(" ");
    if (!txt) continue;
    const e = extremos(ctx, txt, fonteFinal, espacoFinal);
    alturaMinima = Math.max(alturaMinima, e.acima + e.abaixo);
  }

  return {
    linhas,
    largura: maxW,
    altura: Math.max(alturaLinha, linhas.length * alturaLinha),
    tamanho,
    alturaLinha,
    alturaMinima: Math.round(alturaMinima),
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
function faixas(postas: Colocada[]): { x: number; largura: number; texto: string }[] {
  const grupos: { x: number; largura: number; texto: string }[] = [];
  let inicio: Colocada | null = null;
  let fim: Colocada | null = null;
  let palavras: string[] = [];

  const fechar = () => {
    if (inicio && fim) {
      grupos.push({
        x: inicio.x,
        largura: fim.x + fim.largura - inicio.x,
        texto: palavras.join(" "),
      });
    }
    inicio = fim = null;
    palavras = [];
  };

  for (const p of postas) {
    if (p.estilo === "tarja") {
      if (!inicio) inicio = p;
      fim = p;
      palavras.push(p.texto);
    } else {
      fechar();
    }
  }
  fechar();
  return grupos;
}

const corDe = (p: Palavra, c: CamadaTexto) =>
  p.estilo === "tarja" ? c.corTextoTarja : p.estilo === "destaque" ? c.corDestaque : c.cor;

/** Retângulo com cantos e inclinação, girado em torno do próprio centro. */
function caixa(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  raio: number,
  inclinacao: number,
) {
  if (w <= 0 || h <= 0) return;
  ctx.save();
  if (inclinacao) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((inclinacao * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  ctx.beginPath();
  const r = Math.min(raio, w / 2, h / 2);
  if (r > 0 && typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.restore();
}

/**
 * Altura da tarja de um trecho.
 *
 * No modo "metricas" a banda abraça as maiúsculas de verdade — é o que faz a
 * mesma tarja ficar certa na Anton e na Bitter, que têm alturas bem diferentes
 * para o mesmo corpo em px. O modo "fixo" mantém o comportamento antigo.
 */
function alturaTarja(
  ctx: CanvasRenderingContext2D,
  texto: string,
  font: string,
  espaco: number,
  tamanho: number,
  acabamento: AcabamentoTarja,
): { topo: number; altura: number } {
  const padY = tamanho * acabamento.padY;
  if (acabamento.ajuste === "fixo") {
    return { topo: -tamanho * 0.62 - padY, altura: tamanho * 1.24 + padY * 2 };
  }
  const e = extremos(ctx, texto, font, espaco);
  // textBaseline "middle": a base fica ~metade do corpo abaixo do centro da linha
  const base = tamanho * 0.32;
  return { topo: base - e.acima - padY, altura: e.acima + e.abaixo + padY * 2 };
}

/**
 * Desenha o texto no contexto 2D nativo, com a origem no canto superior
 * esquerdo da caixa.
 *
 * Ordem: fundo da camada → sombra → todas as tarjas → todas as palavras.
 * As tarjas saem numa passada só, antes de qualquer palavra: desenhá-las junto
 * com a linha fazia a banda da linha de baixo cobrir o texto da linha de cima
 * sempre que a entrelinha era apertada (que é o padrão dos títulos).
 */
export function desenharTexto(
  ctx: CanvasRenderingContext2D,
  camada: CamadaTexto,
  medida: TextoMedido,
) {
  const { linhas, tamanho, alturaLinha, largura: maxW } = medida;
  const font = fonteCss(camada, tamanho);
  const espaco = camada.espacamento * (tamanho / camada.tamanho || 1);
  const tarja = camada.tarja;
  const padX = tamanho * tarja.padX;

  ctx.save();
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${espaco}px`;
  }

  /* posiciona tudo antes de pintar qualquer coisa */
  const montadas = linhas.map((linha, i) => {
    const meio = i * alturaLinha + alturaLinha / 2;
    const postas = colocar(ctx, linha, camada, font, espaco, maxW);
    const bandas = faixas(postas).map((b) => {
      const { topo, altura } = alturaTarja(ctx, b.texto, font, espaco, tamanho, tarja);
      return {
        x: b.x - padX,
        y: meio + topo,
        largura: b.largura + padX * 2,
        altura,
      };
    });
    return { meio, postas, bandas };
  });

  /* 1. fundo da camada inteira */
  desenharFundo(ctx, camada, medida, montadas);

  /* 2. sombra dura: bandas e palavras deslocadas, tudo na cor da sombra */
  if (camada.sombra.ativa) {
    ctx.save();
    ctx.translate(camada.sombra.x, camada.sombra.y);
    ctx.filter = camada.sombra.desfoque > 0 ? `blur(${camada.sombra.desfoque}px)` : "none";
    ctx.fillStyle = camada.sombra.cor;
    for (const { bandas } of montadas) {
      for (const b of bandas) caixa(ctx, b.x, b.y, b.largura, b.altura, tarja.raio, tarja.inclinacao);
    }
    for (const { meio, postas } of montadas) {
      for (const p of postas) {
        if (p.estilo !== "tarja") ctx.fillText(p.texto, p.x, meio);
      }
    }
    ctx.restore();
  }

  /* 3. todas as tarjas, antes de qualquer palavra */
  ctx.fillStyle = camada.corTarja;
  for (const { bandas } of montadas) {
    for (const b of bandas) caixa(ctx, b.x, b.y, b.largura, b.altura, tarja.raio, tarja.inclinacao);
  }

  /* 4. as palavras */
  for (const { meio, postas } of montadas) {
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
  }

  ctx.restore();
}

type LinhaMontada = {
  meio: number;
  postas: Colocada[];
  bandas: { x: number; y: number; largura: number; altura: number }[];
};

/**
 * A caixa atrás do texto inteiro.
 *
 * `bloco` é uma caixa só cobrindo tudo; `linha` cola uma faixa em cada linha,
 * seguindo a mancha de texto ou a largura toda, conforme o artista escolher.
 */
function desenharFundo(
  ctx: CanvasRenderingContext2D,
  camada: CamadaTexto,
  medida: TextoMedido,
  montadas: LinhaMontada[],
) {
  const f = camada.fundo;
  if (!f.ativo || f.opacidade <= 0) return;

  const { tamanho, largura: maxW } = medida;
  const comTexto = montadas.filter((l) => l.postas.length > 0);
  if (!comTexto.length) return;

  // acima e abaixo do centro da linha, na mesma conta que a tarja por palavra usa
  const acima = tamanho * 0.62;
  const abaixo = tamanho * 0.42;

  ctx.save();
  ctx.globalAlpha = f.opacidade;
  ctx.fillStyle = f.cor;

  const bordas = (l: LinhaMontada) => ({
    esq: f.larguraTotal ? 0 : l.postas[0].x,
    dir: f.larguraTotal ? maxW : l.postas[l.postas.length - 1].x + l.postas[l.postas.length - 1].largura,
  });

  if (f.modo === "bloco") {
    /* dos extremos reais do texto, não da caixa nominal: assim a caixa fica
       colada na mancha mesmo com alinhamento à esquerda ou linhas curtas */
    let esq = Infinity;
    let dir = -Infinity;
    for (const l of comTexto) {
      const b = bordas(l);
      esq = Math.min(esq, b.esq);
      dir = Math.max(dir, b.dir);
    }
    const topo = comTexto[0].meio - acima;
    const base = comTexto[comTexto.length - 1].meio + abaixo;
    caixa(
      ctx,
      esq - f.padX,
      topo - f.padY,
      dir - esq + f.padX * 2,
      base - topo + f.padY * 2,
      f.raio,
      f.inclinacao,
    );
    ctx.restore();
    return;
  }

  for (const l of comTexto) {
    const { esq, dir } = bordas(l);
    caixa(
      ctx,
      esq - f.padX,
      l.meio - acima - f.padY,
      dir - esq + f.padX * 2,
      acima + abaixo + f.padY * 2,
      f.raio,
      f.inclinacao,
    );
  }

  ctx.restore();
}
