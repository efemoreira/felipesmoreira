"use client";

/**
 * Recorte automático de pessoas — roda inteiro no navegador.
 *
 * Usa o segmentador de pessoas do MediaPipe (Apache 2.0), com o wasm e o modelo
 * hospedados no próprio site (public/modelos). Nenhuma foto sai da máquina e
 * não há custo nem chave de API.
 *
 * O modelo devolve uma máscara de 256×256 por categoria (fundo, cabelo, pele,
 * roupa…). A máscara é a soma de tudo que não é fundo, reescalada para o tamanho
 * da foto — daí a borda ficar macia. Por isso existem o limiar e a suavização:
 * são o que transforma uma máscara borrada num recorte utilizável.
 */
import type { ImageSegmenter } from "@mediapipe/tasks-vision";

const CAMINHO_WASM = "/modelos/wasm";
const CAMINHO_MODELO = "/modelos/selfie_multiclass_256x256.tflite";

export interface AjustesRecorte {
  /** 0 a 1 — a partir de quanta confiança o pixel conta como pessoa */
  limiar: number;
  /** 0 a 1 — quanto a borda é amaciada (evita serrilhado) */
  suavizacao: number;
  /** -20 a 20 px — encolhe (negativo) ou engorda a silhueta */
  ajusteBorda: number;
}

export const RECORTE_PADRAO: AjustesRecorte = {
  limiar: 0.5,
  suavizacao: 0.4,
  ajusteBorda: -1,
};

let segmentador: Promise<ImageSegmenter> | null = null;

/** Carrega o modelo uma vez por sessão — são ~28 MB no primeiro uso. */
async function carregar(): Promise<ImageSegmenter> {
  if (segmentador) return segmentador;

  segmentador = (async () => {
    const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
    const visao = await FilesetResolver.forVisionTasks(CAMINHO_WASM);
    return ImageSegmenter.createFromOptions(visao, {
      baseOptions: { modelAssetPath: CAMINHO_MODELO, delegate: "GPU" },
      runningMode: "IMAGE",
      outputCategoryMask: false,
      outputConfidenceMasks: true,
    });
  })();

  try {
    return await segmentador;
  } catch (e) {
    segmentador = null; // deixa tentar de novo depois de uma falha de rede
    throw e;
  }
}

/** Já baixou o modelo? Serve para avisar que o primeiro uso demora. */
export const modeloEmMemoria = () => segmentador !== null;

/** Limite de trabalho: acima disso os pincéis engasgam e não se ganha nitidez. */
export const LADO_MAXIMO = 1400;

/** Reduz a foto para a resolução de trabalho, mantendo a proporção. */
export function canvasDeTrabalho(img: HTMLImageElement): HTMLCanvasElement {
  const maior = Math.max(img.naturalWidth, img.naturalHeight);
  const escala = maior > LADO_MAXIMO ? LADO_MAXIMO / maior : 1;

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

/**
 * Confiança de "isto é pessoa" para cada pixel, no tamanho do canvas de trabalho.
 * Índice 0 é o fundo, então a pessoa é 1 menos ele.
 */
export async function calcularMascara(fonte: HTMLCanvasElement): Promise<Float32Array> {
  const seg = await carregar();
  const resultado = seg.segment(fonte);
  const mascaras = resultado.confidenceMasks;

  if (!mascaras?.length) {
    resultado.close();
    throw new Error("O modelo não devolveu máscara para esta imagem.");
  }

  const fundo = mascaras[0];
  const l = fundo.width;
  const a = fundo.height;
  const dados = fundo.getAsFloat32Array();

  // reamostragem bilinear da máscara pequena para o tamanho de trabalho
  const L = fonte.width;
  const A = fonte.height;
  const saida = new Float32Array(L * A);

  for (let y = 0; y < A; y++) {
    const fy = ((y + 0.5) * a) / A - 0.5;
    const y0 = Math.max(0, Math.floor(fy));
    const y1 = Math.min(a - 1, y0 + 1);
    const ty = fy - y0;

    for (let x = 0; x < L; x++) {
      const fx = ((x + 0.5) * l) / L - 0.5;
      const x0 = Math.max(0, Math.floor(fx));
      const x1 = Math.min(l - 1, x0 + 1);
      const tx = fx - x0;

      const cima = dados[y0 * l + x0] * (1 - tx) + dados[y0 * l + x1] * tx;
      const baixo = dados[y1 * l + x0] * (1 - tx) + dados[y1 * l + x1] * tx;
      saida[y * L + x] = 1 - (cima * (1 - ty) + baixo * ty);
    }
  }

  resultado.close();
  return saida;
}

const entre = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Aplica limiar e suavização na máscara e devolve o alfa final (0–255).
 *
 * Fora da faixa de transição o pixel é sólido ou transparente; dentro dela a
 * opacidade sobe suave, que é o que evita a borda serrilhada. `ajusteBorda`
 * desloca o limiar, comendo ou devolvendo alguns pixels do contorno — útil para
 * tirar a franja da cor do fundo antigo.
 */
export function alfaDaMascara(
  mascara: Float32Array,
  ajustes: AjustesRecorte,
  largura: number,
): Uint8ClampedArray {
  const alfa = new Uint8ClampedArray(mascara.length);
  // o ajuste está em px de borda; vira deslocamento de limiar pela escala da foto
  const desvio = (ajustes.ajusteBorda / Math.max(1, largura)) * 12;
  const centro = entre(ajustes.limiar + desvio, 0.02, 0.98);
  const meia = Math.max(0.01, ajustes.suavizacao * 0.5);

  for (let i = 0; i < mascara.length; i++) {
    const t = entre((mascara[i] - (centro - meia)) / (meia * 2), 0, 1);
    alfa[i] = Math.round(t * t * (3 - 2 * t) * 255);
  }
  return alfa;
}

/**
 * Desenha a foto com o alfa calculado e devolve o PNG transparente.
 * Com `corte`, sai só a caixa da pessoa — sem a folga vazia em volta.
 */
export function montarPng(
  fonte: HTMLCanvasElement,
  alfa: Uint8ClampedArray,
  corte?: { x: number; y: number; largura: number; altura: number },
): Promise<Blob> {
  const L = fonte.width;
  const A = fonte.height;

  const canvas = document.createElement("canvas");
  canvas.width = L;
  canvas.height = A;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(fonte, 0, 0);

  const quadro = ctx.getImageData(0, 0, L, A);
  const d = quadro.data;
  for (let i = 0, p = 3; i < alfa.length; i++, p += 4) d[p] = alfa[i];
  ctx.putImageData(quadro, 0, 0);

  let saida = canvas;
  if (corte && (corte.largura < L || corte.altura < A)) {
    saida = document.createElement("canvas");
    saida.width = corte.largura;
    saida.height = corte.altura;
    saida
      .getContext("2d")!
      .drawImage(
        canvas,
        corte.x,
        corte.y,
        corte.largura,
        corte.altura,
        0,
        0,
        corte.largura,
        corte.altura,
      );
  }

  return new Promise((resolve, reject) =>
    saida.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Não consegui gerar o PNG."))),
      "image/png",
    ),
  );
}

/** Recorta a caixa vazia em volta da pessoa, para a camada não vir com folga. */
export function limitesVisiveis(
  alfa: Uint8ClampedArray,
  largura: number,
  altura: number,
): { x: number; y: number; largura: number; altura: number } | null {
  let x0 = largura;
  let y0 = altura;
  let x1 = -1;
  let y1 = -1;

  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if (alfa[y * largura + x] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < 0) return null;
  return { x: x0, y: y0, largura: x1 - x0 + 1, altura: y1 - y0 + 1 };
}
