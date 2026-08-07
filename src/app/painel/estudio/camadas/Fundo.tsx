"use client";

import { Rect } from "react-konva";
import type { CamadaFundo } from "../tipos";
import type { PropsDecorativa } from "./comum";

/** Chapa de fundo — sempre a camada mais atrás, cobrindo a arte inteira. */
export default function Fundo({ camada, largura, altura }: PropsDecorativa<CamadaFundo>) {
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
      listening={false}
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
