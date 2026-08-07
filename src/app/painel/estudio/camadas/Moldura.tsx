"use client";

import type Konva from "konva";
import { Rect, Shape } from "react-konva";
import { caminhoChanfrado } from "../formas";
import type { CamadaMoldura } from "../tipos";
import type { PropsDecorativa } from "./comum";

/**
 * Moldura dourada de cordel — simples ou dupla, como no "É OFICIAL".
 *
 * Com `chanfro`, as quinas viram cortes de 45°: é o acabamento de placa das
 * referências, que o canto redondo do `raio` não alcança.
 *
 * O `listening: false` importa mais aqui do que nas outras: a moldura é só um
 * filete, mas o canvas de acerto do Konva preenche o caminho inteiro — ou seja,
 * ela era um tapa-clique do tamanho da arte por cima das pessoas e das fotos.
 */
export default function Moldura({ camada, largura, altura }: PropsDecorativa<CamadaMoldura>) {
  const comum = {
    visible: camada.visivel,
    opacity: camada.opacidade,
    listening: false,
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
