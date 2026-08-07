"use client";

/**
 * Texturas procedurais do estúdio.
 *
 * O que separa a arte "gerada" da arte "acabada" das referências quase nunca é a
 * composição: é o grão no fundo, o desgaste dentro das letras, os riscos. Nada
 * disso sai de cor chapada com gradiente linear.
 *
 * Tudo aqui é desenhado por código, com semente fixa. Semente fixa não é
 * capricho: o palco desenha em 1× e a exportação em 2×, e a mesma camada precisa
 * dar o mesmo desenho nas duas — usar `Math.random()` faria o PNG sair diferente
 * do que se vê na tela.
 */
import { hexParaRgb } from "./filtros";

export type ModoTextura = "grao" | "riscos" | "desgaste";

export const ROTULO_TEXTURA: Record<ModoTextura, string> = {
  grao: "Grão de filme",
  riscos: "Riscos",
  desgaste: "Desgaste",
};

/**
 * O grão nasce em cinza neutro e vive de `overlay`: ele soma e subtrai luz em
 * torno do meio, que é o que faz textura de filme. Os outros dois são máscaras
 * de alfa — recebem a cor da camada.
 */
export const TINGE: Record<ModoTextura, boolean> = {
  grao: false,
  riscos: true,
  desgaste: true,
};

/* ===== sorteio com semente ===== */

/** mulberry32 — pequeno, rápido e sempre igual para a mesma semente. */
function sorteio(semente: number): () => number {
  let a = (semente >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ===== cache ===== */

/**
 * Dois caches, porque as peças têm pesos bem diferentes: um ladrilho de 256²
 * ocupa 256 KB e vale guardar aos montes; uma textura pronta de 2160×2700 passa
 * de 20 MB e só as últimas interessam.
 */
function memoria<T>(teto: number) {
  const mapa = new Map<string, T>();
  return (chave: string, criar: () => T): T => {
    const achado = mapa.get(chave);
    if (achado !== undefined) {
      // mais recente vai para o fim: o descarte tira sempre o mais antigo
      mapa.delete(chave);
      mapa.set(chave, achado);
      return achado;
    }
    const novo = criar();
    mapa.set(chave, novo);
    if (mapa.size > teto) {
      const maisAntiga = mapa.keys().next().value;
      if (maisAntiga !== undefined) mapa.delete(maisAntiga);
    }
    return novo;
  };
}

const ladrilhos = memoria<HTMLCanvasElement>(16);
const prontas = memoria<HTMLCanvasElement>(4);

function novoCanvas(largura: number, altura: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(largura));
  c.height = Math.max(1, Math.round(altura));
  return c;
}

/* ===== geradores ===== */

const LADO_GRAO = 256;
const LADO_DESGASTE = 512;

/** Ruído branco: um valor por pixel, alfa cheio. Neutro em 128. */
function ladrilhoGrao(semente: number): HTMLCanvasElement {
  const c = novoCanvas(LADO_GRAO, LADO_GRAO);
  const ctx = c.getContext("2d")!;
  const quadro = ctx.createImageData(LADO_GRAO, LADO_GRAO);
  const d = quadro.data;
  const r = sorteio(semente);

  for (let i = 0; i < d.length; i += 4) {
    // concentrado em torno do meio: a média de dois sorteios já tira o chuvisco
    const v = Math.round(((r() + r()) / 2) * 255);
    d[i] = d[i + 1] = d[i + 2] = v;
    d[i + 3] = 255;
  }

  ctx.putImageData(quadro, 0, 0);
  return c;
}

const suavizar = (t: number) => t * t * (3 - 2 * t);

/**
 * Ruído de valor: sorteia numa grade grossa e interpola entre os nós.
 * Somando oitavas cada vez mais finas sai a mancha irregular do desgaste — e,
 * por ser periódico na largura da grade, o ladrilho fecha sem emenda.
 */
function oitava(destino: Float32Array, lado: number, celulas: number, peso: number, r: () => number) {
  const nos = new Float32Array(celulas * celulas);
  for (let i = 0; i < nos.length; i++) nos[i] = r();
  const passo = lado / celulas;

  for (let y = 0; y < lado; y++) {
    const fy = y / passo;
    const y0 = Math.floor(fy) % celulas;
    const y1 = (y0 + 1) % celulas;
    const ty = suavizar(fy - Math.floor(fy));

    for (let x = 0; x < lado; x++) {
      const fx = x / passo;
      const x0 = Math.floor(fx) % celulas;
      const x1 = (x0 + 1) % celulas;
      const tx = suavizar(fx - Math.floor(fx));

      const cima = nos[y0 * celulas + x0] * (1 - tx) + nos[y0 * celulas + x1] * tx;
      const baixo = nos[y1 * celulas + x0] * (1 - tx) + nos[y1 * celulas + x1] * tx;
      destino[y * lado + x] += (cima * (1 - ty) + baixo * ty) * peso;
    }
  }
}

/** Manchas irregulares — é o que come as letras do título por dentro. */
function ladrilhoDesgaste(semente: number): HTMLCanvasElement {
  const lado = LADO_DESGASTE;
  const c = novoCanvas(lado, lado);
  const ctx = c.getContext("2d")!;
  const campo = new Float32Array(lado * lado);
  const r = sorteio(semente);

  let peso = 0.5;
  let total = 0;
  for (const celulas of [4, 8, 16, 32, 64]) {
    oitava(campo, lado, celulas, peso, r);
    total += peso;
    peso *= 0.55;
  }

  const quadro = ctx.createImageData(lado, lado);
  const d = quadro.data;
  for (let i = 0, p = 0; i < campo.length; i++, p += 4) {
    // limiar suave: o que passa vira mancha, o resto some
    const v = suavizar(Math.min(1, Math.max(0, (campo[i] / total - 0.42) / 0.3)));
    d[p] = d[p + 1] = d[p + 2] = 255;
    d[p + 3] = Math.round(v * 255);
  }

  ctx.putImageData(quadro, 0, 0);
  return c;
}

/**
 * Arranhões: traços finos e compridos, densidade proporcional à área.
 *
 * Este não é ladrilhado — risco repetido em grade é a primeira coisa que o olho
 * pega. Vai no tamanho da arte mesmo.
 */
function desenharRiscos(
  ctx: CanvasRenderingContext2D,
  semente: number,
  largura: number,
  altura: number,
  escala: number,
) {
  const r = sorteio(semente);
  const diagonal = Math.hypot(largura, altura);
  const quantos = Math.round((diagonal / 22) * Math.max(0.2, escala));

  ctx.save();
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineCap = "round";

  for (let i = 0; i < quantos; i++) {
    const x = r() * largura;
    const y = r() * altura;
    // quase todos curtos; um em cada seis atravessa um pedaço grande da arte
    const comprido = r() < 0.16;
    const comprimento = diagonal * (comprido ? 0.2 + r() * 0.4 : 0.01 + r() * 0.06);
    const angulo = (r() - 0.5) * Math.PI * (comprido ? 0.5 : 2);

    ctx.globalAlpha = comprido ? 0.1 + r() * 0.2 : 0.2 + r() * 0.5;
    ctx.lineWidth = Math.max(0.5, (0.5 + r() * 1.6) * escala);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(angulo) * comprimento, y + Math.sin(angulo) * comprimento);
    ctx.stroke();
  }

  ctx.restore();
}

/* ===== entrada única ===== */

export interface PedidoTextura {
  modo: ModoTextura;
  semente: number;
  cor: string;
  largura: number;
  altura: number;
  /** 1 é o desenho no tamanho natural; acima disso ele engrossa */
  escala: number;
  /**
   * Devolve o desenho como recorte em vez de como pintura.
   *
   * Riscos e desgaste já nascem assim — são manchas com alfa. O grão não: ele é
   * cinza opaco de ponta a ponta, porque vive de `overlay`. Quem quer *comer* a
   * letra com grão precisa dele virado em máscara, senão o `destination-out`
   * apagaria o glifo inteiro em vez de salpicá-lo.
   */
  comoMascara?: boolean;
}

/**
 * A textura pronta para compor, no tamanho pedido e já na cor da camada.
 *
 * Sai colada num canvas próprio porque `destination-in` dentro de um `sceneFunc`
 * pegaria a tela inteira do Konva — a camada da frente apagaria tudo que já foi
 * desenhado atrás dela.
 */
export function texturaPronta(p: PedidoTextura): HTMLCanvasElement {
  const l = Math.max(1, Math.round(p.largura));
  const a = Math.max(1, Math.round(p.altura));
  const escala = Math.max(0.1, p.escala);
  const mascara = !!p.comoMascara;
  const tinge = TINGE[p.modo] || mascara;
  const chave = `${p.modo}|${p.semente}|${tinge ? p.cor : "-"}|${l}x${a}|${escala.toFixed(2)}|${mascara ? "m" : "p"}`;

  return prontas(chave, () => {
    const canvas = novoCanvas(l, a);
    const ctx = canvas.getContext("2d")!;

    if (p.modo === "riscos") {
      desenharRiscos(ctx, p.semente, l, a, escala);
    } else {
      const ladrilho = ladrilhos(`${p.modo}|${p.semente}`, () =>
        p.modo === "grao" ? ladrilhoGrao(p.semente) : ladrilhoDesgaste(p.semente),
      );
      const padrao = ctx.createPattern(ladrilho, "repeat");
      if (padrao) {
        // o ladrilho é quadrado: escalar o padrão engrossa o desenho sem emenda
        padrao.setTransform(new DOMMatrix([escala, 0, 0, escala, 0, 0]));
        ctx.fillStyle = padrao;
        ctx.fillRect(0, 0, l, a);
      }
    }

    // grão pedido como recorte: o brilho de cada pixel vira o alfa dele
    if (mascara && p.modo === "grao") {
      const quadro = ctx.getImageData(0, 0, l, a);
      const d = quadro.data;
      for (let i = 0; i < d.length; i += 4) d[i + 3] = d[i];
      ctx.putImageData(quadro, 0, 0);
    }

    if (tinge) {
      const [r, g, b] = hexParaRgb(p.cor);
      ctx.globalCompositeOperation = "source-in";
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(0, 0, l, a);
    }

    return canvas;
  });
}
