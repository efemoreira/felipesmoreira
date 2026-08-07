"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Rect, Shape } from "react-konva";
import { caminhoChanfrado } from "../formas";
import type { CamadaMoldura } from "../tipos";

interface Props {
  camada: CamadaMoldura;
  largura: number;
  altura: number;
  onSelecionar: (e?: KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

/**
 * Moldura dourada de cordel — simples ou dupla, como no "É OFICIAL".
 *
 * Com `chanfro`, as quinas viram cortes de 45°: é o acabamento de placa das
 * referências, que o canto redondo do `raio` não alcança.
 */
export default function Moldura({ camada, largura, altura, onSelecionar }: Props) {
  const comum = {
    visible: camada.visivel,
    opacity: camada.opacidade,
    listening: !camada.travada,
    onMouseDown: onSelecionar,
    onTouchStart: onSelecionar,
  };

  /** `dentro` é o quanto esta linha se afasta da externa. */
  const traco = (dentro: number, espessura: number, chave: string) => {
    const id = chave === "externa" ? camada.id : `${camada.id}-${chave}`;
    const recuo = camada.recuo + dentro;
    const w = Math.max(1, largura - recuo * 2);
    const h = Math.max(1, altura - recuo * 2);

    if (camada.chanfro > 0) {
      // o corte da linha de dentro encolhe o mesmo tanto que ela recuou:
      // é o que mantém as duas paralelas na quina em vez de as cruzar
      const chanfro = Math.max(2, camada.chanfro - dentro);
      return (
        <Shape
          key={chave}
          id={id}
          {...comum}
          sceneFunc={(ctx: Konva.Context, shape: Konva.Shape) => {
            caminhoChanfrado(ctx, recuo, recuo, w, h, chanfro);
            shape.strokeWidth(espessura);
            shape.stroke(camada.cor);
            ctx.fillStrokeShape(shape);
          }}
        />
      );
    }

    return (
      <Rect
        key={chave}
        id={id}
        {...comum}
        x={recuo}
        y={recuo}
        width={w}
        height={h}
        cornerRadius={camada.raio}
        stroke={camada.cor}
        strokeWidth={espessura}
      />
    );
  };

  return (
    <>
      {traco(0, camada.espessura, "externa")}
      {camada.dupla &&
        traco(camada.espessura * 2.6, Math.max(1, camada.espessura * 0.4), "interna")}
    </>
  );
}
