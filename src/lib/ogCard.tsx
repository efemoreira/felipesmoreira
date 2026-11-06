import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * O cartão que aparece quando alguém cola um link do site no WhatsApp.
 *
 * Existe porque o canal que mais importa aqui é justamente o de link colado em
 * grupo: uma peça do `/kit` compartilhada com o card genérico ("de militante de
 * internet a militante de rua") desperdiça a única linha que o WhatsApp mostra.
 * Cada rota diz do que ela trata.
 *
 * **As fontes são as do site**, lidas do disco no build (`src/lib/fontes/`,
 * TTF sob a OFL — o Satori não lê woff2). Ficou um tempo em sans do sistema
 * "porque a moldura e o ouro carregam a identidade"; carregavam, menos no
 * lugar em que o cartão mais circula, o WhatsApp, onde só o título aparece.
 * Todo cartão é `force-static`: a leitura acontece uma vez, na exportação.
 * As cores são as de `theme.ts`, escritas à mão porque este módulo roda no
 * runtime de imagem e não no navegador.
 */

export const TAMANHO_OG = { width: 1200, height: 630 };

const OURO = "#FFCB05";
const TINTA = "#181203";
const SUAVE = "#5F5E59";
const OURO_QUEIMADO = "#856006";

export interface CartaoOG {
  /** o rótulo de cima, curto */
  kicker: string;
  /** o que a página é, em duas ou três palavras */
  titulo: string;
  /** uma linha de apoio; opcional */
  linha?: string;
}

const PASTA_FONTES = path.join(process.cwd(), "src/lib/fontes");

async function fontes() {
  const [alfa, media, negrito] = await Promise.all([
    readFile(path.join(PASTA_FONTES, "AlfaSlabOne-Regular.ttf")),
    readFile(path.join(PASTA_FONTES, "Figtree-Medium.ttf")),
    readFile(path.join(PASTA_FONTES, "Figtree-Bold.ttf")),
  ]);
  return [
    { name: "Alfa Slab One", data: alfa, weight: 400 as const, style: "normal" as const },
    { name: "Figtree", data: media, weight: 500 as const, style: "normal" as const },
    { name: "Figtree", data: negrito, weight: 700 as const, style: "normal" as const },
  ];
}

/** Os raios do sol, os mesmos de `components/site/Sol.tsx`, em SVG para o Satori. */
function raiosDoSol(): string {
  const ponto = (raio: number, grau: number) => {
    const a = (grau * Math.PI) / 180;
    return `${(Math.sin(a) * raio).toFixed(2)},${(-Math.cos(a) * raio).toFixed(2)}`;
  };
  const raios = Array.from({ length: 24 }, (_, i) => {
    const g = i * 15;
    const [base, ponta, abre] = i % 2 === 0 ? [60, 98, 5.3] : [60, 84, 4.2];
    return `<polygon points="${ponto(base, g - abre)} ${ponto(base, g + abre)} ${ponto(ponta, g)}" fill="${OURO}"/>`;
  }).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200" width="400" height="400">${raios}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export async function cartaoOG({ kicker, titulo, linha }: CartaoOG) {
  const emblema = await readFile(path.join(process.cwd(), "src/app/icon.png"));
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#FFFFFF",
          color: TINTA,
          fontFamily: "Figtree, sans-serif",
          position: "relative",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 780, paddingLeft: 72, paddingBottom: 14 }}>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 700, color: OURO_QUEIMADO }}>{kicker}</div>
          <div
            style={{
              display: "flex",
              fontFamily: "Alfa Slab One, serif",
              fontSize: titulo.length > 22 ? 72 : 92,
              fontWeight: 400,
              marginTop: 14,
              lineHeight: 1.08,
            }}
          >
            {titulo}
          </div>
          {linha && <div style={{ display: "flex", fontSize: 32, fontWeight: 500, marginTop: 20, color: SUAVE, lineHeight: 1.3 }}>{linha}</div>}
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, marginTop: 26 }}>felipesmoreira.com</div>
        </div>

        {/* O sol das onças, o mesmo da abertura da home. */}
        <div style={{ position: "absolute", top: 104, right: 34, width: 400, height: 400, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={raiosDoSol()} width={400} height={400} style={{ position: "absolute", top: 0, left: 0 }} />
          {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
          <img src={`data:image/png;base64,${emblema.toString("base64")}`} width={252} height={252} style={{ borderRadius: 126 }} />
        </div>

        {/* A faixa de ouro no pé: a mesma assinatura das artes em canvas. */}
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 26, display: "flex", background: OURO }} />
      </div>
    ),
    { ...TAMANHO_OG, fonts: await fontes() },
  );
}
