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
 * Esmaece as bordas até a transparência — é o que faz a foto de contexto se
 * dissolver no fundo em vez de terminar num retângulo duro.
 * O valor é a fração de cada lado que vira degradê (0.3 = 30% de cada borda).
 */
export const Esmaecer: FilterFunction = function (this: Nó, imageData: ImageData) {
  const forca = entre(Number(this.getAttr("esmaecerForca") ?? 0), 0, 1);
  if (forca <= 0) return;

  const { width: w, height: h, data: d } = imageData;
  const faixaX = Math.max(1, (w * forca) / 2);
  const faixaY = Math.max(1, (h * forca) / 2);

  for (let y = 0; y < h; y++) {
    const dy = suavizar(entre(Math.min(y, h - 1 - y) / faixaY, 0, 1));
    for (let x = 0; x < w; x++) {
      const dx = suavizar(entre(Math.min(x, w - 1 - x) / faixaX, 0, 1));
      const i = (y * w + x) * 4 + 3;
      d[i] *= Math.min(dx, dy);
    }
  }
};
