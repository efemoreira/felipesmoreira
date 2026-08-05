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
 * Gradiente que sobe da base do recorte.
 *
 * "dissolver" apaga o corpo aos poucos, fazendo a pessoa nascer do fundo em vez
 * de terminar num corte reto; "pintar" leva a base para uma cor. Cada pessoa
 * tem o seu, então dá para dissolver duas em profundidades diferentes.
 */
export const Gradiente: FilterFunction = function (this: Nó, imageData: ImageData) {
  const forca = entre(Number(this.getAttr("gradienteForca") ?? 0), 0, 1);
  const extensao = entre(Number(this.getAttr("gradienteExtensao") ?? 0), 0.01, 1);
  if (forca <= 0) return;

  const pintar = this.getAttr("gradienteModo") === "pintar";
  const [r, g, b] = hexParaRgb(String(this.getAttr("gradienteCor") ?? "#14110C"));
  const { width: w, height: h, data: d } = imageData;
  const faixa = Math.max(1, h * extensao);

  for (let y = 0; y < h; y++) {
    // 1 na última linha, 0 no topo da faixa
    const rampa = suavizar(1 - entre((h - 1 - y) / faixa, 0, 1)) * forca;
    if (rampa <= 0) continue;

    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] === 0) continue;
      if (pintar) {
        d[i] += (r - d[i]) * rampa;
        d[i + 1] += (g - d[i + 1]) * rampa;
        d[i + 2] += (b - d[i + 2]) * rampa;
      } else {
        d[i + 3] *= 1 - rampa;
      }
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

  if (elipse) {
    // a maior fração pedida manda: o "raio limpo" no centro encolhe conforme ela
    const forca = Math.max(topo, direita, base, esquerda, cantos);
    if (forca <= 0) return;
    const cx = (w - 1) / 2;
    const cy = (h - 1) / 2;

    for (let y = 0; y < h; y++) {
      const ny = (y - cy) / Math.max(1, cy);
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4 + 3;
        if (d[i] === 0) continue;
        const nx = (x - cx) / Math.max(1, cx);
        const r = Math.sqrt(nx * nx + ny * ny);
        // fora do raio limpo, a opacidade cai até zerar na borda do quadro
        d[i] *= rampa((1 - r) / forca);
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
      const i = (y * w + x) * 4 + 3;
      if (d[i] === 0) continue; // já transparente: nada a fazer

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

      if (alfa < 1) d[i] *= alfa;
    }
  }
};
