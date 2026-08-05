"use client";

import type Konva from "konva";
import { useRef } from "react";
import { Circle, Group, Image as ImagemKonva } from "react-konva";
import { useImagem } from "../useImagem";
import type { CamadaAvatar } from "../tipos";
import Reservado from "./Reservado";
import {
  aoArrastar,
  aoTransformar,
  atributosDeAjuste,
  filtrosDe,
  useCacheFiltros,
  type PropsCamada,
} from "./comum";

/** Retrato redondo com anel — o selo pequeno do canto, tipo "guto zacarias". */
export default function Avatar({
  camada,
  onSelecionar,
  onAlterar,
  interativo,
}: PropsCamada<CamadaAvatar>) {
  const img = useImagem(camada.ativoId);
  const ref = useRef<Konva.Image>(null);

  const filtros = filtrosDe(camada.ajustes);
  const d = Math.min(camada.largura, camada.altura);
  const raio = d / 2;

  useCacheFiltros(
    ref,
    filtros.length > 0 && !!img,
    `${camada.ativoId}|${d}|${JSON.stringify(camada.ajustes)}`,
  );

  if (!img) {
    if (!interativo) return null;
    return (
      <Reservado
        id={camada.id}
        x={camada.x}
        y={camada.y}
        largura={d}
        altura={d}
        rotacao={camada.rotacao}
        rotulo={camada.nome}
        onSelecionar={onSelecionar}
        arrastavel={interativo && !camada.travada}
        onArrastar={aoArrastar((m) => onAlterar(m))}
      />
    );
  }

  // recorta a imagem cobrindo o círculo (object-fit: cover)
  const escala = Math.max(d / img.naturalWidth, d / img.naturalHeight);
  const iw = img.naturalWidth * escala;
  const ih = img.naturalHeight * escala;

  return (
    <Group
      id={camada.id}
      x={camada.x}
      y={camada.y}
      rotation={camada.rotacao}
      width={d}
      height={d}
      offsetX={raio}
      offsetY={raio}
      opacity={camada.opacidade}
      visible={camada.visivel}
      draggable={interativo && !camada.travada}
      listening={interativo && !camada.travada}
      onMouseDown={onSelecionar}
      onTouchStart={onSelecionar}
      onDragEnd={aoArrastar((m) => onAlterar(m))}
      onTransformEnd={aoTransformar(
        { ...camada, largura: d, altura: d },
        (m) => onAlterar(m as Partial<CamadaAvatar>),
      )}
    >
      <Group
        clipFunc={(ctx) => {
          ctx.beginPath();
          ctx.arc(raio, raio, raio, 0, Math.PI * 2, false);
          ctx.closePath();
        }}
        shadowEnabled={camada.sombra.ativa}
        shadowColor={camada.sombra.cor}
        shadowOffsetX={camada.sombra.x}
        shadowOffsetY={camada.sombra.y}
        shadowBlur={camada.sombra.desfoque}
      >
        <ImagemKonva
          ref={ref}
          image={img}
          x={(d - iw) / 2}
          y={(d - ih) / 2}
          width={iw}
          height={ih}
          filters={filtros}
          {...atributosDeAjuste(camada.ajustes)}
          listening={false}
        />
      </Group>

      {camada.anel.ativo && (
        <Circle
          x={raio}
          y={raio}
          radius={raio - camada.anel.espessura / 2}
          stroke={camada.anel.cor}
          strokeWidth={camada.anel.espessura}
          listening={false}
        />
      )}
    </Group>
  );
}
