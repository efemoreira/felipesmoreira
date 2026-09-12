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
const CREME = "#F6F5EF";
const OURO_FRACO = "#FFDE5A";

export interface CartaoOG {
  /** a pílula de cima — curta, em caixa-alta */
  kicker: string;
  /** o que a página é, em duas ou três palavras */
  titulo: string;
  /** uma linha de apoio; opcional */
  linha?: string;
}

const PASTA_FONTES = path.join(process.cwd(), "src/lib/fontes");

async function fontes() {
  const [alfa, bitter] = await Promise.all([
    readFile(path.join(PASTA_FONTES, "AlfaSlabOne-Regular.ttf")),
    readFile(path.join(PASTA_FONTES, "Bitter-Regular.ttf")),
  ]);
  return [
    { name: "Alfa Slab One", data: alfa, weight: 400 as const, style: "normal" as const },
    { name: "Bitter", data: bitter, weight: 400 as const, style: "normal" as const },
  ];
}

export async function cartaoOG({ kicker, titulo, linha }: CartaoOG) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #14110C 0%, #241C10 55%, #3A2A16 100%)",
          color: CREME,
          fontFamily: "Bitter, serif",
          position: "relative",
        }}
      >
        {/* Moldura de cordel: tinta por fora, ouro por dentro.
            Lados explícitos, e não `inset: 28`: o Satori (o renderizador do
            next/og) não entende a abreviação, e o resultado era um cartão sem
            moldura nenhuma — como estava em produção desde sempre. Também
            precisa de `display:flex`, que o Satori exige em todo elemento. */}
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 28,
            bottom: 28,
            left: 28,
            display: "flex",
            border: `6px solid ${TINTA}`,
            boxShadow: `inset 0 0 0 4px ${OURO}`,
          }}
        />

        <div
          style={{
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: TINTA,
            background: OURO,
            padding: "10px 28px",
            fontWeight: 700,
          }}
        >
          {kicker}
        </div>

        <div
          style={{
            fontFamily: "Alfa Slab One, serif",
            fontSize: titulo.length > 26 ? 78 : 104,
            fontWeight: 400,
            marginTop: 28,
            color: OURO,
            textShadow: `4px 4px 0 ${TINTA}`,
            textAlign: "center",
            maxWidth: 1020,
            lineHeight: 1.05,
          }}
        >
          {titulo}
        </div>

        {linha && (
          <div
            style={{
              fontSize: 32,
              marginTop: 20,
              maxWidth: 960,
              textAlign: "center",
              color: CREME,
              lineHeight: 1.3,
            }}
          >
            {linha}
          </div>
        )}

        <div style={{ fontSize: 25, marginTop: 28, color: OURO_FRACO }}>
          felipesmoreira.com
        </div>
      </div>
    ),
    { ...TAMANHO_OG, fonts: await fontes() },
  );
}
