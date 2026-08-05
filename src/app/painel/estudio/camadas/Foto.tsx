"use client";

import type Konva from "konva";
import { useRef } from "react";
import { Image as ImagemKonva } from "react-konva";
import { useImagem } from "../useImagem";
import type { CamadaFoto } from "../tipos";
import Reservado from "./Reservado";
import {
  aoArrastar,
  aoTransformar,
  atributosDeAjuste,
  atributosDeEsmaecer,
  esmaeceAlgo,
  filtrosDe,
  useCacheFiltros,
  type PropsCamada,
} from "./comum";

/**
 * Foto de contexto — a que fica atrás, dessaturada e escura, dando assunto à
 * arte (a cadeia, a bandeira, o palanque). O "esmaecer" dissolve as bordas para
 * ela não terminar num retângulo duro.
 */
export default function Foto({
  camada,
  onSelecionar,
  onAlterar,
  interativo,
  qualidade,
}: PropsCamada<CamadaFoto>) {
  const img = useImagem(camada.ativoId);
  const ref = useRef<Konva.Image>(null);

  const esmaece = esmaeceAlgo(camada.esmaecer);
  const filtros = filtrosDe(camada.ajustes, { esmaecer: esmaece });

  useCacheFiltros(
    ref,
    filtros.length > 0 && !!img,
    `${camada.ativoId}|${camada.largura}x${camada.altura}|${JSON.stringify(camada.ajustes)}|${JSON.stringify(camada.esmaecer)}`,
    qualidade,
  );

  if (!img) {
    if (!interativo) return null;
    return (
      <Reservado
        id={camada.id}
        x={camada.x}
        y={camada.y}
        largura={camada.largura}
        altura={camada.altura}
        rotacao={camada.rotacao}
        rotulo={`${camada.nome}\n(foto de contexto)`}
        onSelecionar={onSelecionar}
        arrastavel={interativo && !camada.travada}
        onArrastar={aoArrastar((m) => onAlterar(m))}
      />
    );
  }

  return (
    <ImagemKonva
      ref={ref}
      id={camada.id}
      image={img}
      x={camada.x}
      y={camada.y}
      width={camada.largura}
      height={camada.altura}
      offsetX={camada.largura / 2}
      offsetY={camada.altura / 2}
      rotation={camada.rotacao}
      scaleX={camada.espelhado ? -1 : 1}
      opacity={camada.opacidade}
      visible={camada.visivel}
      draggable={interativo && !camada.travada}
      listening={interativo && !camada.travada}
      globalCompositeOperation={
        camada.mistura === "normal"
          ? undefined
          : (camada.mistura as GlobalCompositeOperation)
      }
      filters={filtros}
      {...atributosDeAjuste(camada.ajustes)}
      {...atributosDeEsmaecer(camada.esmaecer)}
      onMouseDown={onSelecionar}
      onTouchStart={onSelecionar}
      onDragEnd={aoArrastar((m) => onAlterar(m))}
      onTransformEnd={aoTransformar(camada, (m) => onAlterar(m as Partial<CamadaFoto>))}
    />
  );
}
