/**
 * Texto com cor, corpo e material por palavra — o que o `Konva.Text` não faz.
 *
 * Nas referências o título quase nunca é de uma cor só: parte fica em ouro,
 * parte em branco, um pedaço vem sobre uma tarja amarela e uma palavra pequena
 * se encaixa entre as grandes. Então a camada de texto é um `Konva.Shape` com
 * desenho próprio e uma marcação curta:
 *
 *   URGENTE!              → cor base
 *   *APROVA PROJETO*      → cor de destaque
 *   ==PROPAGANDA==        → tarja (fundo colorido, texto escuro)
 *   ^com^                 → corpo reduzido, cor própria
 *   :pin:                 → ícone do conjunto do site
 *   |                     → filete vertical divisor
 *
 * Além da tarja por palavra existe o **fundo da camada**: uma caixa atrás do
 * texto inteiro (bloco único ou faixa por linha), que é o que dá leitura quando
 * o texto cai em cima de uma foto — e que, com chanfro e borda, vira a placa de
 * data e hora das referências.
 *
 * Por cima de tudo isso vem o acabamento do glifo: gradiente atravessando o
 * bloco, desgaste comendo as letras e brilho difuso em volta. É o que separa um
 * título "digitado" de um título "impresso".
 */
import { extremos, medir } from "@/lib/textoCanvas";
import { familia } from "@/lib/fontes";
import { iconPaths } from "../../icons";
import { caminhoChanfrado } from "./formas";
import { FONTES } from "./paleta";
import { mascaraDesgaste } from "./textura";
import type { AcabamentoTarja, CamadaTexto } from "./tipos";

export type Estilo = "base" | "destaque" | "tarja" | "menor";

export interface Palavra {
  texto: string;
  estilo: Estilo;
  /** no lugar do glifo entra este ícone do conjunto do site */
  icone?: string;
  /** filete vertical divisor, da altura das maiúsculas */
  filete?: boolean;
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

/** O corpo desta palavra: `^assim^` vive menor dentro da mesma frase. */
const corpoDe = (p: Palavra, camada: CamadaTexto, tamanho: number) =>
  p.estilo === "menor" ? Math.max(8, tamanho * camada.menor.escala) : tamanho;

/* ===== marcação ===== */

const ICONE = /^:([a-z][a-z0-9-]*):$/i;

/** Divide o texto cru em palavras já com o estilo e o papel de cada uma. */
export function analisar(cru: string, caixaAlta: boolean): Palavra[][] {
  const fonte = caixaAlta ? cru.toLocaleUpperCase("pt-BR") : cru;

  return fonte.split("\n").map((linha) => {
    const palavras: Palavra[] = [];
    // captura ==tarja==, *destaque* e ^menor^; o resto cai no grupo do texto solto
    const padrao = /==([^=]+)==|\*([^*]+)\*|\^([^^]+)\^|([^=*^]+|[=*^])/g;

    for (const achado of linha.matchAll(padrao)) {
      const [, tarja, destaque, menor, solto] = achado;
      const trecho = tarja ?? destaque ?? menor ?? solto ?? "";
      const estilo: Estilo = tarja
        ? "tarja"
        : destaque
          ? "destaque"
          : menor
            ? "menor"
            : "base";

      for (const p of trecho.split(/\s+/).filter(Boolean)) {
        if (p === "|") {
          palavras.push({ texto: p, estilo, filete: true });
          continue;
        }
        // a caixa alta já passou por aqui, então o nome do ícone chega maiúsculo
        const nome = ICONE.exec(p)?.[1]?.toLowerCase();
        if (nome && nome in iconPaths) {
          palavras.push({ texto: p, estilo, icone: nome });
          continue;
        }
        palavras.push({ texto: p, estilo });
      }
    }
    return palavras;
  });
}

/* ===== medição e quebra ===== */

/** Largura de uma palavra, seja ela glifo, ícone ou filete. */
function larguraDe(
  ctx: CanvasRenderingContext2D,
  p: Palavra,
  camada: CamadaTexto,
  tamanho: number,
  espaco: number,
): number {
  if (p.filete) return Math.max(2, tamanho * 0.07);
  if (p.icone) return tamanho * 0.82;
  const corpo = corpoDe(p, camada, tamanho);
  return medir(ctx, p.texto, fonteCss(camada, corpo), espaco * (corpo / tamanho));
}

function quebrarPalavras(
  ctx: CanvasRenderingContext2D,
  palavras: Palavra[],
  maxW: number,
  camada: CamadaTexto,
  tamanho: number,
  espaco: number,
): Linha[] {
  if (!palavras.length) return [{ palavras: [], largura: 0 }];

  const larguraEspaco = medir(ctx, " ", fonteCss(camada, tamanho), espaco);
  const linhas: Linha[] = [];
  let atual: Palavra[] = [];
  let largura = 0;

  for (const palavra of palavras) {
    const w = larguraDe(ctx, palavra, camada, tamanho, espaco);
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
    const espaco = camada.espacamento * (tamanho / camada.tamanho || 1);

    linhas = paragrafos.flatMap((palavras) =>
      quebrarPalavras(ctx, palavras, maxW, camada, tamanho, espaco),
    );

    const estoura = linhas.some((l) => l.largura > maxW + 0.5);
    if (!estoura || !camada.autoAjuste || tamanho <= 12) break;
    tamanho = Math.max(12, Math.round(tamanho * 0.94));
  }

  const alturaLinha = tamanho * camada.entrelinha;

  /* a linha mais "alta" do bloco define o mínimo para nenhuma encostar na outra;
     ícone e filete ficam de fora porque não têm acento para subir */
  const fonteFinal = fonteCss(camada, tamanho);
  const espacoFinal = camada.espacamento * (tamanho / camada.tamanho || 1);
  let alturaMinima = 0;
  for (const l of linhas) {
    const txt = l.palavras
      .filter((p) => !p.icone && !p.filete && p.estilo !== "menor")
      .map((p) => p.texto)
      .join(" ");
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
  /** corpo desta palavra em px — o `^menor^` não usa o da camada */
  corpo: number;
}

/** Posiciona as palavras de uma linha conforme o alinhamento. */
function colocar(
  ctx: CanvasRenderingContext2D,
  linha: Linha,
  camada: CamadaTexto,
  tamanho: number,
  espaco: number,
  maxW: number,
): Colocada[] {
  const larguraEspaco = medir(ctx, " ", fonteCss(camada, tamanho), espaco);
  const sobra = maxW - linha.largura;
  let x = camada.alinhamento === "center" ? sobra / 2 : camada.alinhamento === "right" ? sobra : 0;

  return linha.palavras.map((p) => {
    const largura = larguraDe(ctx, p, camada, tamanho, espaco);
    const posta = { ...p, x, largura, corpo: corpoDe(p, camada, tamanho) };
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
  p.estilo === "tarja"
    ? c.corTextoTarja
    : p.estilo === "destaque"
      ? c.corDestaque
      : p.estilo === "menor"
        ? c.menor.cor
        : c.cor;

interface AcabamentoCaixa {
  raio?: number;
  chanfro?: number;
  inclinacao?: number;
  borda?: { ativa: boolean; cor: string; espessura: number };
}

/** Retângulo com cantos, chanfro e inclinação, girado em torno do próprio centro. */
function caixa(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  o: AcabamentoCaixa,
) {
  if (w <= 0 || h <= 0) return;
  const { raio = 0, chanfro = 0, inclinacao = 0, borda } = o;

  ctx.save();
  if (inclinacao) {
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate((inclinacao * Math.PI) / 180);
    ctx.translate(-(x + w / 2), -(y + h / 2));
  }

  // o chanfro manda sobre o raio: os dois juntos não descrevem nenhuma forma útil
  if (chanfro > 0) {
    caminhoChanfrado(ctx, x, y, w, h, chanfro);
  } else {
    ctx.beginPath();
    const r = Math.min(raio, w / 2, h / 2);
    if (r > 0 && typeof ctx.roundRect === "function") ctx.roundRect(x, y, w, h, r);
    else ctx.rect(x, y, w, h);
  }
  ctx.fill();

  if (borda?.ativa && borda.espessura > 0) {
    ctx.strokeStyle = borda.cor;
    ctx.lineWidth = borda.espessura;
    ctx.stroke();
  }

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

/** Ícone do conjunto do site, encaixado na altura das maiúsculas. */
function desenharIcone(
  ctx: CanvasRenderingContext2D,
  nome: string,
  x: number,
  meio: number,
  corpo: number,
  cor: string,
) {
  const tracos = (iconPaths as Record<string, string[]>)[nome];
  if (!tracos) return;
  const lado = corpo * 0.82;

  ctx.save();
  ctx.translate(x, meio - lado / 2);
  ctx.scale(lado / 24, lado / 24);
  ctx.strokeStyle = cor;
  // a espessura do traço do ícone acompanha o corpo, para não sumir num título grande
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of tracos) ctx.stroke(new Path2D(d));
  ctx.restore();
}

/** Filete vertical divisor — o traço entre "SEXTA" e "18:30". */
function desenharFilete(
  ctx: CanvasRenderingContext2D,
  x: number,
  meio: number,
  largura: number,
  corpo: number,
  cor: string,
) {
  const altura = corpo * 0.96;
  ctx.save();
  ctx.fillStyle = cor;
  ctx.globalAlpha *= 0.55;
  ctx.fillRect(x, meio - altura / 2 + corpo * 0.05, Math.max(2, largura * 0.55), altura);
  ctx.restore();
}

/** A escala real do contexto — 1 no palco, 2 na exportação em alta. */
function escalaDo(ctx: CanvasRenderingContext2D): number {
  if (typeof ctx.getTransform !== "function") return 1;
  const m = ctx.getTransform();
  return Math.max(0.1, Math.hypot(m.a, m.b));
}

type LinhaMontada = {
  meio: number;
  postas: Colocada[];
  bandas: { x: number; y: number; largura: number; altura: number }[];
};

/**
 * Desenha o texto no contexto 2D nativo, com a origem no canto superior
 * esquerdo da caixa.
 *
 * Ordem: fundo da camada → brilho → sombra → todas as tarjas → contornos →
 * todas as palavras. As tarjas saem numa passada só, antes de qualquer palavra:
 * desenhá-las junto com a linha fazia a banda da linha de baixo cobrir o texto
 * da linha de cima sempre que a entrelinha era apertada (que é o padrão dos
 * títulos).
 */
export function desenharTexto(
  ctx: CanvasRenderingContext2D,
  camada: CamadaTexto,
  medida: TextoMedido,
) {
  const { linhas, tamanho, alturaLinha, largura: maxW } = medida;
  const espaco = camada.espacamento * (tamanho / camada.tamanho || 1);
  const font = fonteCss(camada, tamanho);
  const tarja = camada.tarja;
  const padX = tamanho * tarja.padX;

  ctx.save();
  aplicarFonte(ctx, font, espaco);

  /* posiciona tudo antes de pintar qualquer coisa */
  const montadas: LinhaMontada[] = linhas.map((linha, i) => {
    const meio = i * alturaLinha + alturaLinha / 2;
    const postas = colocar(ctx, linha, camada, tamanho, espaco, maxW);
    const bandas = faixas(postas).map((b) => {
      const { topo, altura } = alturaTarja(ctx, b.texto, font, espaco, tamanho, tarja);
      return { x: b.x - padX, y: meio + topo, largura: b.largura + padX * 2, altura };
    });
    return { meio, postas, bandas };
  });

  const acabamentoTarja: AcabamentoCaixa = { raio: tarja.raio, inclinacao: tarja.inclinacao };

  /* 1. fundo da camada inteira */
  desenharFundo(ctx, camada, medida, montadas);

  /* 2. brilho: as mesmas palavras, borradas, na cor quente. Vem antes da sombra
        porque é luz de trás — a sombra dura é de contato e fica por cima dele. */
  if (camada.brilho.ativo && camada.brilho.forca > 0) {
    ctx.save();
    ctx.filter = `blur(${Math.max(1, camada.brilho.desfoque)}px)`;
    ctx.globalAlpha = camada.brilho.forca;
    ctx.fillStyle = camada.brilho.cor;
    for (const { meio, postas } of montadas) {
      for (const p of postas) escreverPalavra(ctx, p, meio, camada, tamanho, espaco, true);
    }
    ctx.restore();
    aplicarFonte(ctx, font, espaco);
  }

  /* 3. sombra dura: bandas e palavras deslocadas, tudo na cor da sombra */
  if (camada.sombra.ativa) {
    ctx.save();
    ctx.translate(camada.sombra.x, camada.sombra.y);
    ctx.filter = camada.sombra.desfoque > 0 ? `blur(${camada.sombra.desfoque}px)` : "none";
    ctx.fillStyle = camada.sombra.cor;
    for (const { bandas } of montadas) {
      for (const b of bandas) caixa(ctx, b.x, b.y, b.largura, b.altura, acabamentoTarja);
    }
    for (const { meio, postas } of montadas) {
      for (const p of postas) {
        if (p.estilo !== "tarja") escreverPalavra(ctx, p, meio, camada, tamanho, espaco, true);
      }
    }
    ctx.restore();
    aplicarFonte(ctx, font, espaco);
  }

  /* 4. todas as tarjas, antes de qualquer palavra */
  ctx.fillStyle = camada.corTarja;
  for (const { bandas } of montadas) {
    for (const b of bandas) caixa(ctx, b.x, b.y, b.largura, b.altura, acabamentoTarja);
  }

  /* 5. contornos por baixo dos preenchimentos, senão eles comem metade da haste */
  if (camada.contorno.ativo && camada.contorno.espessura > 0) {
    ctx.save();
    ctx.lineWidth = camada.contorno.espessura;
    ctx.strokeStyle = camada.contorno.cor;
    ctx.lineJoin = "round";
    ctx.miterLimit = 2;
    for (const { meio, postas } of montadas) {
      for (const p of postas) {
        if (p.icone || p.filete) continue;
        aplicarFonte(ctx, fonteCss(camada, p.corpo), espaco * (p.corpo / tamanho));
        ctx.strokeText(p.texto, p.x, meio);
      }
    }
    ctx.restore();
    aplicarFonte(ctx, font, espaco);
  }

  /* 6. as palavras, com o material escolhido */
  desenharPalavras(ctx, camada, medida, montadas);

  ctx.restore();
}

function aplicarFonte(ctx: CanvasRenderingContext2D, font: string, espaco: number) {
  ctx.font = font;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  if ("letterSpacing" in ctx) {
    (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${espaco}px`;
  }
}

/**
 * Uma palavra no seu lugar — glifo, ícone ou filete.
 * Com `chapado`, sai toda no `fillStyle` corrente: é o que a sombra e o brilho
 * precisam, já que ali a cor de cada palavra não importa.
 */
function escreverPalavra(
  ctx: CanvasRenderingContext2D,
  p: Colocada,
  meio: number,
  camada: CamadaTexto,
  tamanho: number,
  espaco: number,
  chapado: boolean,
) {
  const cor = chapado ? (ctx.fillStyle as string) : corDe(p, camada);

  if (p.filete) {
    desenharFilete(ctx, p.x, meio, p.largura, p.corpo, cor);
    return;
  }
  if (p.icone) {
    desenharIcone(ctx, p.icone, p.x, meio, p.corpo, cor);
    return;
  }

  const mudou = p.corpo !== tamanho;
  if (mudou) aplicarFonte(ctx, fonteCss(camada, p.corpo), espaco * (p.corpo / tamanho));
  if (!chapado) ctx.fillStyle = cor;
  ctx.fillText(p.texto, p.x, meio);
  if (mudou) aplicarFonte(ctx, fonteCss(camada, tamanho), espaco);
}

/**
 * O preenchimento das palavras.
 *
 * Sem gradiente nem desgaste é o caminho curto: pinta cada palavra na sua cor e
 * acabou. Com um dos dois, as palavras vão para um canvas à parte, onde
 * `source-atop` e `destination-out` conseguem trabalhar só sobre os glifos — no
 * contexto do Konva esses modos pegariam a tela inteira e apagariam as camadas
 * já desenhadas atrás.
 */
function desenharPalavras(
  ctx: CanvasRenderingContext2D,
  camada: CamadaTexto,
  medida: TextoMedido,
  montadas: LinhaMontada[],
) {
  const { tamanho, altura, largura: maxW } = medida;
  const espaco = camada.espacamento * (tamanho / camada.tamanho || 1);
  const font = fonteCss(camada, tamanho);
  const gradiente = camada.preenchimento.modo === "gradiente";
  const desgaste = camada.textura.ativa && camada.textura.forca > 0;

  /* caminho curto: sem material especial, cada palavra sai na sua cor e pronto */
  if (!gradiente && !desgaste) {
    for (const { meio, postas } of montadas) {
      for (const p of postas) escreverPalavra(ctx, p, meio, camada, tamanho, espaco, false);
    }
    return;
  }

  /* folga generosa: acentos e o "y" passam da caixa nominal do bloco */
  const folga = tamanho;
  const ow = Math.ceil(maxW + folga * 2);
  const oh = Math.ceil(altura + folga * 2);
  const escala = escalaDo(ctx);

  const assinatura = [
    camada.texto,
    camada.fonte,
    camada.caixaAlta,
    camada.alinhamento,
    tamanho,
    espaco,
    maxW,
    altura,
    escala,
    camada.cor,
    camada.corDestaque,
    camada.corTextoTarja,
    JSON.stringify(camada.preenchimento),
    JSON.stringify(camada.textura),
    JSON.stringify(camada.menor),
  ].join("|");

  const fora = comMaterial(assinatura, ow, oh, escala, (oc) => {
    oc.translate(folga, folga);
    aplicarFonte(oc, font, espaco);

    /* as palavras de corpo normal recebem o gradiente; destaque, menor e tarja
       mantêm a cor escolhida, senão a marcação *assim* perderia o sentido */
    const daCor: { p: Colocada; meio: number }[] = [];

    for (const { meio, postas } of montadas) {
      for (const p of postas) {
        if (gradiente && p.estilo === "base") {
          oc.fillStyle = "#FFFFFF";
          escreverPalavra(oc, p, meio, camada, tamanho, espaco, true);
        } else {
          daCor.push({ p, meio });
        }
      }
    }

    if (gradiente) {
      const rad = (camada.preenchimento.angulo * Math.PI) / 180;
      const dx = (Math.sin(rad) * maxW) / 2;
      const dy = (Math.cos(rad) * altura) / 2;
      const g = oc.createLinearGradient(
        maxW / 2 - dx,
        altura / 2 - dy,
        maxW / 2 + dx,
        altura / 2 + dy,
      );
      g.addColorStop(0, camada.cor);
      g.addColorStop(1, camada.preenchimento.cor2);
      oc.save();
      // "source-atop": a cor só chega onde já existe glifo
      oc.globalCompositeOperation = "source-atop";
      oc.fillStyle = g;
      oc.fillRect(-folga, -folga, ow, oh);
      oc.restore();
    }

    for (const { p, meio } of daCor) {
      escreverPalavra(oc, p, meio, camada, tamanho, espaco, false);
    }

    if (desgaste) {
      const mascara = mascaraDesgaste(
        camada.textura.semente,
        ow * escala,
        oh * escala,
        camada.textura.escala * escala,
      );
      oc.save();
      // "destination-out": onde a mancha é opaca, o glifo é comido
      oc.globalCompositeOperation = "destination-out";
      oc.globalAlpha = camada.textura.forca;
      oc.drawImage(mascara, -folga, -folga, ow, oh);
      oc.restore();
    }
  });

  if (fora) ctx.drawImage(fora, -folga, -folga, ow, oh);
}

/**
 * O canvas com as palavras já materializadas, guardado entre quadros.
 *
 * Arrastar a camada faz o Konva redesenhar a cada movimento do mouse, e alocar
 * um canvas de 2160 px por quadro engasga o palco. Como só uma camada de texto
 * é trabalhada de cada vez, guardar a última já resolve.
 */
let ultimoMaterial: { assinatura: string; canvas: HTMLCanvasElement } | null = null;

function comMaterial(
  assinatura: string,
  ow: number,
  oh: number,
  escala: number,
  pintar: (oc: CanvasRenderingContext2D) => void,
): HTMLCanvasElement | null {
  if (ultimoMaterial?.assinatura === assinatura) return ultimoMaterial.canvas;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(ow * escala));
  canvas.height = Math.max(1, Math.ceil(oh * escala));
  const oc = canvas.getContext("2d");
  if (!oc) return null;

  oc.scale(escala, escala);
  pintar(oc);

  ultimoMaterial = { assinatura, canvas };
  return canvas;
}

/**
 * A caixa atrás do texto inteiro.
 *
 * `bloco` é uma caixa só cobrindo tudo; `linha` cola uma faixa em cada linha,
 * seguindo a mancha de texto ou a largura toda, conforme o artista escolher.
 * Com chanfro e borda ligados, é a placa de data e hora das referências.
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
  const acabamento: AcabamentoCaixa = {
    raio: f.raio,
    chanfro: f.chanfro,
    inclinacao: f.inclinacao,
    borda: f.borda,
  };

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
      acabamento,
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
      acabamento,
    );
  }

  ctx.restore();
}
