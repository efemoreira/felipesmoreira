import { ImageResponse } from "next/og";

/**
 * O cartão que aparece quando alguém cola um link do site no WhatsApp.
 *
 * Existe porque o canal que mais importa aqui é justamente o de link colado em
 * grupo: uma peça do `/kit` compartilhada com o card genérico ("de militante de
 * internet a militante de rua") desperdiça a única linha que o WhatsApp mostra.
 * Cada rota diz do que ela trata.
 *
 * **Sem fonte carregada de propósito.** O `next/og` teria que baixar e embutir
 * o woff de Alfa Slab One a cada geração; a família do sistema já dá o peso que
 * o cartão precisa, e a identidade aqui é carregada pela moldura e pelo ouro.
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

export function cartaoOG({ kicker, titulo, linha }: CartaoOG) {
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
          fontFamily: "sans-serif",
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
            fontSize: titulo.length > 26 ? 78 : 104,
            fontWeight: 900,
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
    { ...TAMANHO_OG },
  );
}
