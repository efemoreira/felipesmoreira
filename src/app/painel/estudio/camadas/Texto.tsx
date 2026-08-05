"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useMemo } from "react";
import { Shape } from "react-konva";
import { desenharTexto, medirTexto } from "../texto";
import type { CamadaTexto } from "../tipos";
import { aoArrastar, type PropsCamada } from "./comum";

interface Props extends PropsCamada<CamadaTexto> {
  /** muda quando as fontes terminam de carregar, para remedir tudo */
  selo: number;
}

/**
 * Texto com cor por palavra.
 *
 * `Konva.Text` só pinta de uma cor, e as referências dependem de misturar ouro,
 * branco e tarja amarela na mesma frase — então o desenho é próprio
 * (ver texto.ts). O clique usa uma área retangular simples: pegar exatamente na
 * letra seria pior de usar.
 */
export default function Texto({
  camada,
  onSelecionar,
  onAlterar,
  interativo,
  selo,
}: Props) {
  const medida = useMemo(
    () => medirTexto(camada),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [camada, selo],
  );

  const aoRedimensionar = (e: KonvaEventObject<Event>) => {
    const no = e.target;
    const escala = Math.abs(no.scaleX());
    no.scaleX(1);
    no.scaleY(1);
    onAlterar({
      x: no.x(),
      y: no.y(),
      rotacao: no.rotation(),
      largura: Math.max(80, Math.round(camada.largura * escala)),
    });
  };

  return (
    <Shape
      id={camada.id}
      x={camada.x}
      y={camada.y}
      rotation={camada.rotacao}
      width={medida.largura}
      height={medida.altura}
      offsetX={medida.largura / 2}
      offsetY={medida.altura / 2}
      opacity={camada.opacidade}
      visible={camada.visivel}
      draggable={interativo && !camada.travada}
      listening={interativo && !camada.travada}
      onMouseDown={onSelecionar}
      onTouchStart={onSelecionar}
      onDragEnd={aoArrastar((m) => onAlterar(m))}
      onTransformEnd={aoRedimensionar}
      sceneFunc={(ctx: Konva.Context) => {
        const nativo = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;
        desenharTexto(nativo, camada, medida);
      }}
      hitFunc={(ctx: Konva.Context, shape: Konva.Shape) => {
        ctx.beginPath();
        ctx.rect(0, 0, medida.largura, medida.altura);
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      }}
    />
  );
}
