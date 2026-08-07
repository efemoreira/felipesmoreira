/**
 * Filtros próprios do estúdio.
 *
 * Konva chama o filtro com `this` apontando para o nó, então os parâmetros
 * viajam como atributos comuns (`node.setAttr`). Como um atributo solto não
 * invalida o cache de filtro do Konva, quem mexe nos parâmetros precisa chamar
 * `node.cache()` de novo — é o que o `useCacheFiltros` faz.
 */
import type { FilterFunction } from "konva/lib/Node";

type Nó = { getAttr: (nome: string) => unknown };

export function hexParaRgb(hex: string): [number, number, number] {
  const limpo = hex.replace("#", "").trim();
  const cheio =
    limpo.length === 3
      ? limpo
          .split("")
          .map((c) => c + c)
          .join("")
      : limpo;
  const n = parseInt(cheio.slice(0, 6) || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const entre = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Silhueta: puxa o RGB de cada pixel para a cor escolhida e **preserva o alfa**.
 * Com força 1 o recorte vira um vulto chapado; abaixo disso é um véu de cor.
 * É o efeito das cópias fantasma que aparecem atrás das pessoas nas referências.
 */
export const Tinta: FilterFunction = function (this: Nó, imageData: ImageData) {
  const forca = entre(Number(this.getAttr("tintaForca") ?? 1), 0, 1);
  if (forca <= 0) return;

  const [r, g, b] = hexParaRgb(String(this.getAttr("tintaCor") ?? "#000000"));
  const d = imageData.data;

  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue; // fora do recorte, não mexe
    d[i] += (r - d[i]) * forca;
    d[i + 1] += (g - d[i + 1]) * forca;
    d[i + 2] += (b - d[i + 2]) * forca;
  }
};

const suavizar = (t: number) => t * t * (3 - 2 * t);

/**
 * Gradiente entrando por uma das bordas do recorte.
 *
 * "dissolver" apaga o corpo aos poucos, fazendo a pessoa nascer do fundo em vez
 * de terminar num corte reto; "pintar" leva aquela borda para uma cor; "ambos"
 * faz as duas na mesma rampa — o corpo some *na* cor, que é o que dá o efeito
 * de fumaça. Cada pessoa tem o seu, então dá para dissolver duas em
 * profundidades e direções diferentes.
 */
export const Gradiente: FilterFunction = function (this: Nó, imageData: ImageData) {
  const forca = entre(Number(this.getAttr("gradienteForca") ?? 0), 0, 1);
  const extensao = entre(Number(this.getAttr("gradienteExtensao") ?? 0), 0.01, 1);
  if (forca <= 0) return;

  const modo = String(this.getAttr("gradienteModo") ?? "dissolver");
  const pinta = modo === "pintar" || modo === "ambos";
  const dissolve = modo === "dissolver" || modo === "ambos";
  const direcao = String(this.getAttr("gradienteDirecao") ?? "base");

  const [r, g, b] = hexParaRgb(String(this.getAttr("gradienteCor") ?? "#14110C"));
  const { width: w, height: h, data: d } = imageData;

  /* A rampa só depende da distância até a borda escolhida, então ela é tabelada
     uma vez em vez de recalculada por pixel — numa pessoa de 900px isso é a
     diferença entre o palco responder e engasgar ao arrastar o slider. */
  const vertical = direcao === "base" || direcao === "topo";
  const total = vertical ? h : w;
  const faixa = Math.max(1, total * extensao);
  const rampas = new Float32Array(total);
  for (let i = 0; i < total; i++) {
    // 1 na própria borda, 0 no fim da faixa
    rampas[i] = suavizar(1 - entre(i / faixa, 0, 1)) * forca;
  }

  // distância de cada linha (ou coluna) até a borda de onde o gradiente entra
  const daBorda = (i: number, tamanho: number, doFim: boolean) => (doFim ? tamanho - 1 - i : i);
  const doFim = direcao === "base" || direcao === "direita";

  for (let y = 0; y < h; y++) {
    const rampaLinha = vertical ? rampas[daBorda(y, h, doFim)] : 0;
    if (vertical && rampaLinha <= 0) continue;

    for (let x = 0; x < w; x++) {
      const rampa = vertical ? rampaLinha : rampas[daBorda(x, w, doFim)];
      if (rampa <= 0) continue;

      const i = (y * w + x) * 4;
      if (d[i + 3] === 0) continue;
      if (pinta) {
        d[i] += (r - d[i]) * rampa;
        d[i + 1] += (g - d[i + 1]) * rampa;
        d[i + 2] += (b - d[i + 2]) * rampa;
      }
      if (dissolve) d[i + 3] *= 1 - rampa;
    }
  }
};

/**
 * Esmaece as bordas até a transparência — é o que faz uma imagem se dissolver
 * no fundo em vez de terminar num retângulo duro.
 *
 * Cada lado tem a sua fração (0.3 = 30% daquela borda vira degradê), e `cantos`
 * apaga só as quinas: é o pedido de "opacidade nos cantos" sem comer o meio dos
 * lados. `dureza` inclina a curva — 0 é uma transição bem longa, 1 quase um corte.
 * No modo elipse tudo isso vira uma máscara radial a partir do centro.
 */
export const Esmaecer: FilterFunction = function (this: Nó, imageData: ImageData) {
  const lado = (nome: string) => entre(Number(this.getAttr(nome) ?? 0), 0, 1);
  const topo = lado("esmaecerTopo");
  const direita = lado("esmaecerDireita");
  const base = lado("esmaecerBase");
  const esquerda = lado("esmaecerEsquerda");
  const cantos = lado("esmaecerCantos");
  const elipse = this.getAttr("esmaecerModo") === "elipse";

  if (!elipse && topo <= 0 && direita <= 0 && base <= 0 && esquerda <= 0 && cantos <= 0) return;

  /*
   * A dureza aperta a transição em torno do meio da faixa: em 0 ela se espalha
   * pela faixa inteira (bem suave), em 1 acontece num fio (quase um corte seco).
   * O ponto médio não anda, então subir a dureza endurece a borda sem comer mais
   * imagem — foi assim que se percebeu que elevar a rampa a um expoente, além de
   * endurecer, encolhia o desenho.
   */
  const dureza = entre(Number(this.getAttr("esmaecerDureza") ?? 0.5), 0, 1);
  const faixaRampa = Math.max(0.02, 1 - dureza);
  const inicioRampa = 0.5 - faixaRampa / 2;
  const rampa = (t: number) => suavizar(entre((t - inicioRampa) / faixaRampa, 0, 1));

  const { width: w, height: h, data: d } = imageData;

  /*
   * Duas saídas para a mesma rampa: abrir buraco (o alfa cai) ou morrer numa cor
   * (o RGB caminha até ela e o alfa fica de pé). A segunda existe porque, sobre
   * um fundo escuro, uma foto que vira vazio recorta uma forma estranha no meio
   * da arte — enquanto uma que morre no tom do fundo simplesmente some.
   */
  const paraCor = this.getAttr("esmaecerSaida") === "cor";
  const [cr, cg, cb] = hexParaRgb(String(this.getAttr("esmaecerCor") ?? "#14110C"));

  /** Aplica a rampa no pixel que começa em `p`. */
  const aplicar = (p: number, alfa: number) => {
    if (alfa >= 1) return;
    if (!paraCor) {
      d[p + 3] *= alfa;
      return;
    }
    const m = 1 - alfa;
    d[p] += (cr - d[p]) * m;
    d[p + 1] += (cg - d[p + 1]) * m;
    d[p + 2] += (cb - d[p + 2]) * m;
  };

  if (elipse) {
    // a maior fração pedida manda: o "raio limpo" no centro encolhe conforme ela
    const forca = Math.max(topo, direita, base, esquerda, cantos);
    if (forca <= 0) return;
    const cx = (w - 1) / 2;
    const cy = (h - 1) / 2;

    for (let y = 0; y < h; y++) {
      const ny = (y - cy) / Math.max(1, cy);
      for (let x = 0; x < w; x++) {
        const p = (y * w + x) * 4;
        if (d[p + 3] === 0) continue;
        const nx = (x - cx) / Math.max(1, cx);
        const r = Math.sqrt(nx * nx + ny * ny);
        // fora do raio limpo, a opacidade cai até zerar na borda do quadro
        aplicar(p, rampa((1 - r) / forca));
      }
    }
    return;
  }

  const faixa = (fracao: number, total: number) => (fracao > 0 ? Math.max(1, total * fracao) : 0);
  const fTopo = faixa(topo, h);
  const fBase = faixa(base, h);
  const fEsq = faixa(esquerda, w);
  const fDir = faixa(direita, w);
  // o canto usa a menor dimensão para ficar redondo mesmo numa imagem alongada
  const fCanto = faixa(cantos, Math.min(w, h));

  for (let y = 0; y < h; y++) {
    const aTopo = fTopo ? rampa(y / fTopo) : 1;
    const aBase = fBase ? rampa((h - 1 - y) / fBase) : 1;

    for (let x = 0; x < w; x++) {
      const p = (y * w + x) * 4;
      if (d[p + 3] === 0) continue; // já transparente: nada a fazer

      let alfa = Math.min(aTopo, aBase);
      if (fEsq) alfa = Math.min(alfa, rampa(x / fEsq));
      if (fDir) alfa = Math.min(alfa, rampa((w - 1 - x) / fDir));

      if (fCanto) {
        // distância até o canto mais próximo, medida por dentro da quina
        const dx = Math.max(0, fCanto - Math.min(x, w - 1 - x));
        const dy = Math.max(0, fCanto - Math.min(y, h - 1 - y));
        if (dx > 0 && dy > 0) {
          alfa = Math.min(alfa, rampa(1 - Math.sqrt(dx * dx + dy * dy) / fCanto));
        }
      }

      aplicar(p, alfa);
    }
  }
};

/* ===== luz em volta do recorte ===== */

/**
 * Máximo móvel numa direção — a dilatação do alfa.
 *
 * Feito com janela deslizante em duas passadas (X e depois Y), o que dá O(n) em
 * vez do O(n·raio) do laço ingênuo: com raio de 14 px numa pessoa de 900 px de
 * altura a diferença é entre travar e não travar o palco.
 */
function dilatar(alfa: Uint8ClampedArray, w: number, h: number, raio: number): Uint8ClampedArray {
  if (raio <= 0) return alfa;
  const r = Math.round(raio);

  const passada = (
    entrada: Uint8ClampedArray,
    comprimento: number,
    linhas: number,
    passo: number,
    salto: number,
  ) => {
    const saida = new Uint8ClampedArray(entrada.length);
    for (let linha = 0; linha < linhas; linha++) {
      const inicio = linha * salto;
      for (let i = 0; i < comprimento; i++) {
        let max = 0;
        const de = Math.max(0, i - r);
        const ate = Math.min(comprimento - 1, i + r);
        for (let j = de; j <= ate; j++) {
          const v = entrada[inicio + j * passo];
          if (v > max) max = v;
          if (max === 255) break;
        }
        saida[inicio + i * passo] = max;
      }
    }
    return saida;
  };

  // horizontal (passo 1, salto w) e depois vertical (passo w, salto 1)
  return passada(passada(alfa, w, h, 1, w), h, w, w, 1);
}

/** Desfoque de caixa separável, duas passadas — vira gaussiano o bastante. */
function borrar(alfa: Uint8ClampedArray, w: number, h: number, raio: number): Uint8ClampedArray {
  if (raio <= 0) return alfa;
  const r = Math.max(1, Math.round(raio));
  let atual = alfa;

  for (let vez = 0; vez < 2; vez++) {
    for (const horizontal of [true, false]) {
      const comprimento = horizontal ? w : h;
      const linhas = horizontal ? h : w;
      const passo = horizontal ? 1 : w;
      const salto = horizontal ? w : 1;
      const saida = new Uint8ClampedArray(atual.length);

      for (let linha = 0; linha < linhas; linha++) {
        const inicio = linha * salto;
        let soma = 0;
        // janela inicial, com as bordas repetindo o primeiro pixel
        for (let j = -r; j <= r; j++) {
          soma += atual[inicio + Math.min(comprimento - 1, Math.max(0, j)) * passo];
        }
        const largura = r * 2 + 1;
        for (let i = 0; i < comprimento; i++) {
          saida[inicio + i * passo] = soma / largura;
          const sai = Math.min(comprimento - 1, Math.max(0, i - r));
          const entra = Math.min(comprimento - 1, Math.max(0, i + r + 1));
          soma += atual[inicio + entra * passo] - atual[inicio + sai * passo];
        }
      }
      atual = saida;
    }
  }
  return atual;
}

const alfaDe = (d: Uint8ClampedArray): Uint8ClampedArray => {
  const a = new Uint8ClampedArray(d.length / 4);
  for (let i = 0, p = 3; i < a.length; i++, p += 4) a[i] = d[p];
  return a;
};

/**
 * Halo: a silhueta engordada, desfocada e pintada de uma cor só.
 *
 * A engorda acontece **no alfa**, não na imagem. A primeira versão desenhava a
 * mesma foto num tamanho maior atrás do recorte — mas isso é escala, não
 * dilatação: o contorno crescia proporcionalmente à distância do centro, então o
 * topo da cabeça ganhava o dobro de halo dos ombros e o excesso vazava pelas
 * laterais. Era a franja amarela irregular das artes antigas.
 */
export const Halo: FilterFunction = function (this: Nó, imageData: ImageData) {
  const tamanho = Math.max(0, Number(this.getAttr("haloTamanho") ?? 0));
  const desfoque = Math.max(0, Number(this.getAttr("haloDesfoque") ?? 0));
  const forca = entre(Number(this.getAttr("haloForca") ?? 1), 0, 1);
  if (forca <= 0 || (tamanho <= 0 && desfoque <= 0)) return;

  const { width: w, height: h, data: d } = imageData;
  const [r, g, b] = hexParaRgb(String(this.getAttr("haloCor") ?? "#FFCB05"));
  const alfa = borrar(dilatar(alfaDe(d), w, h, tamanho), w, h, desfoque);

  for (let i = 0, p = 0; i < alfa.length; i++, p += 4) {
    d[p] = r;
    d[p + 1] = g;
    d[p + 2] = b;
    d[p + 3] = alfa[i] * forca;
  }
};

/**
 * Luz de contorno: a borda do corpo acesa de um lado só.
 *
 * O alfa original menos o alfa deslocado na direção da luz deixa exatamente a
 * fatia de borda que está virada para ela. Desfocando de leve e pintando por
 * cima, sai o brilho quente que gruda o recorte no fundo.
 */
export const LuzBorda: FilterFunction = function (this: Nó, imageData: ImageData) {
  const forca = entre(Number(this.getAttr("luzForca") ?? 0), 0, 1);
  const espessura = Math.max(0, Number(this.getAttr("luzEspessura") ?? 0));
  if (forca <= 0 || espessura <= 0) return;

  const { width: w, height: h, data: d } = imageData;
  const [r, g, b] = hexParaRgb(String(this.getAttr("luzCor") ?? "#FFCB05"));
  const rad = (Number(this.getAttr("luzAngulo") ?? 315) * Math.PI) / 180;
  const dx = Math.round(Math.cos(rad) * espessura);
  const dy = Math.round(Math.sin(rad) * espessura);

  const original = alfaDe(d);
  const faixa = new Uint8ClampedArray(original.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (original[i] === 0) continue;
      // vizinho no sentido de onde a luz vem: se lá é vazio, este pixel é borda
      const vx = x - dx;
      const vy = y - dy;
      const vizinho =
        vx < 0 || vy < 0 || vx >= w || vy >= h ? 0 : original[vy * w + vx];
      const corte = original[i] - vizinho;
      if (corte > 0) faixa[i] = corte;
    }
  }

  const acesa = borrar(faixa, w, h, Math.max(1, espessura * 0.5));

  for (let i = 0, p = 0; i < acesa.length; i++, p += 4) {
    const t = (acesa[i] / 255) * forca;
    if (t <= 0) continue;
    // soma luz em vez de trocar a cor: a pele por baixo continua aparecendo
    d[p] = Math.min(255, d[p] + r * t);
    d[p + 1] = Math.min(255, d[p + 1] + g * t);
    d[p + 2] = Math.min(255, d[p + 2] + b * t);
  }
};
