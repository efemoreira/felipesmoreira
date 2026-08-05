"use client";

import { Rect } from "react-konva";
import { hexParaRgb } from "../filtros";
import type { CamadaSombreado } from "../tipos";

interface Props {
  camada: CamadaSombreado;
  largura: number;
  altura: number;
  onSelecionar: () => void;
}

const rgba = (cor: string, a: number) => {
  const [r, g, b] = hexParaRgb(cor);
  return `rgba(${r},${g},${b},${a})`;
};

/**
 * A camada que faz o texto ser legível: escurece a base (e/ou o topo) da arte
 * num degradê. Em todas as referências ela existe, mesmo quando não se nota.
 */
export default function Sombreado({ camada, largura, altura, onSelecionar }: Props) {
  const comum = {
    id: camada.id,
    x: 0,
    width: largura,
    visible: camada.visivel,
    opacity: camada.opacidade,
    listening: !camada.travada,
    onMouseDown: onSelecionar,
    onTouchStart: onSelecionar,
  };

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
