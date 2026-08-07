"use client";

import { Rect } from "react-konva";
import { hexParaRgb } from "../filtros";
import type { CamadaSombreado } from "../tipos";
import type { PropsDecorativa } from "./comum";

const rgba = (cor: string, a: number) => {
  const [r, g, b] = hexParaRgb(cor);
  return `rgba(${r},${g},${b},${a})`;
};

/**
 * A camada que faz o texto ser legível: escurece a base (e/ou o topo) da arte
 * num degradê. Em todas as referências ela existe, mesmo quando não se nota.
 */
export default function Sombreado({
  camada,
  largura,
  altura,
}: PropsDecorativa<CamadaSombreado>) {
  const comum = {
    id: camada.id,
    x: 0,
    width: largura,
    visible: camada.visivel,
    opacity: camada.opacidade,
    listening: false,
  };

  /*
   * O holofote é o contrário da vinheta: em vez de fechar as bordas, ele
   * **soma** luz num ponto. É o que dá o clarão quente atrás das pessoas nas
   * referências — sem ele o recorte fica boiando num fundo morto.
   */
  if (camada.direcao === "foco") {
    const cx = largura * camada.centro.x;
    const cy = altura * camada.centro.y;
    const raio = Math.max(largura, altura) * Math.max(0.05, camada.extensao);
    return (
      <Rect
        {...comum}
        y={0}
        height={altura}
        globalCompositeOperation="lighter"
        fillRadialGradientStartPoint={{ x: cx, y: cy }}
        fillRadialGradientEndPoint={{ x: cx, y: cy }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndRadius={raio}
        fillRadialGradientColorStops={[
          0,
          rgba(camada.cor, camada.forca),
          // a queda cedo evita o disco chapado: o brilho tem de morrer no meio
          0.45,
          rgba(camada.cor, camada.forca * 0.28),
          1,
          rgba(camada.cor, 0),
        ]}
      />
    );
  }

  if (camada.direcao === "vinheta") {
    const raio = Math.max(largura, altura) * 0.75;
    return (
      <Rect
        {...comum}
        y={0}
        height={altura}
        fillRadialGradientStartPoint={{ x: largura / 2, y: altura / 2 }}
        fillRadialGradientEndPoint={{ x: largura / 2, y: altura / 2 }}
        fillRadialGradientStartRadius={raio * (1 - camada.extensao)}
        fillRadialGradientEndRadius={raio}
        fillRadialGradientColorStops={[0, rgba(camada.cor, 0), 1, rgba(camada.cor, camada.forca)]}
      />
    );
  }

  /* laterais: o degradê vem de um lado e abre espaço para o texto no outro.
     É o que uma peça em paisagem precisa — pessoa num terço, texto no resto. */
  if (camada.direcao === "esquerda" || camada.direcao === "direita") {
    const faixaX = Math.max(1, largura * camada.extensao);
    const daEsquerda = camada.direcao === "esquerda";
    return (
      <Rect
        {...comum}
        x={daEsquerda ? 0 : largura - faixaX}
        y={0}
        width={faixaX}
        height={altura}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: faixaX, y: 0 }}
        fillLinearGradientColorStops={
          daEsquerda
            ? [0, rgba(camada.cor, camada.forca), 1, rgba(camada.cor, 0)]
            : [0, rgba(camada.cor, 0), 1, rgba(camada.cor, camada.forca)]
        }
      />
    );
  }

  const faixa = Math.max(1, altura * camada.extensao);

  // "ambos" é o par que aparece nas referências: topo suave + base pesada
  if (camada.direcao === "ambos") {
    return (
      <>
        <Rect
          {...comum}
          id={`${camada.id}-topo`}
          y={0}
          height={faixa * 0.7}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: faixa * 0.7 }}
          fillLinearGradientColorStops={[
            0,
            rgba(camada.cor, camada.forca * 0.85),
            1,
            rgba(camada.cor, 0),
          ]}
        />
        <Rect
          {...comum}
          y={altura - faixa}
          height={faixa}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: faixa }}
          fillLinearGradientColorStops={[0, rgba(camada.cor, 0), 1, rgba(camada.cor, camada.forca)]}
        />
      </>
    );
  }

  const doTopo = camada.direcao === "topo";
  return (
    <Rect
      {...comum}
      y={doTopo ? 0 : altura - faixa}
      height={faixa}
      fillLinearGradientStartPoint={{ x: 0, y: 0 }}
      fillLinearGradientEndPoint={{ x: 0, y: faixa }}
      fillLinearGradientColorStops={
        doTopo
          ? [0, rgba(camada.cor, camada.forca), 1, rgba(camada.cor, 0)]
          : [0, rgba(camada.cor, 0), 1, rgba(camada.cor, camada.forca)]
      }
    />
  );
}
