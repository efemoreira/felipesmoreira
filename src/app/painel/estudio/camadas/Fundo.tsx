"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import { Rect } from "react-konva";
import type { CamadaFundo } from "../tipos";

interface Props {
  camada: CamadaFundo;
  largura: number;
  altura: number;
  onSelecionar: (e?: KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

/** Chapa de fundo — sempre a camada mais atrás, cobrindo a arte inteira. */
export default function Fundo({ camada, largura, altura, onSelecionar }: Props) {
  const rad = (camada.angulo * Math.PI) / 180;
  // o degradê atravessa a diagonal do ângulo pedido, sem sobrar canto sem cor
  const meiaLargura = (Math.abs(Math.sin(rad)) * largura) / 2;
  const meiaAltura = (Math.abs(Math.cos(rad)) * altura) / 2;

  return (
    <Rect
      id={camada.id}
      x={0}
      y={0}
      width={largura}
      height={altura}
      visible={camada.visivel}
      opacity={camada.opacidade}
      listening={!camada.travada}
      onMouseDown={onSelecionar}
      onTouchStart={onSelecionar}
      {...(camada.modo === "solida"
        ? { fill: camada.cor }
        : {
            fillLinearGradientStartPoint: {
              x: largura / 2 - meiaLargura,
              y: altura / 2 - meiaAltura,
            },
            fillLinearGradientEndPoint: {
              x: largura / 2 + meiaLargura,
              y: altura / 2 + meiaAltura,
            },
            fillLinearGradientColorStops: [0, camada.cor, 1, camada.cor2],
          })}
    />
  );
}
