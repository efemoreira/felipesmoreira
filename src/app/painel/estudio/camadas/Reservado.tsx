"use client";

import type { KonvaEventObject } from "konva/lib/Node";
import { Group, Rect, Text } from "react-konva";
import { CORES } from "../paleta";

interface Props {
  id: string;
  x: number;
  y: number;
  largura: number;
  altura: number;
  rotacao: number;
  rotulo: string;
  onSelecionar: () => void;
  arrastavel: boolean;
  onArrastar: (e: KonvaEventObject<DragEvent>) => void;
}

/** Espaço reservado de um modelo — a caixa "troque a foto aqui". */
export default function Reservado({
  id,
  x,
  y,
  largura,
  altura,
  rotacao,
  rotulo,
  onSelecionar,
  arrastavel,
  onArrastar,
}: Props) {
  return (
    <Group
      id={id}
      x={x}
      y={y}
      rotation={rotacao}
      offsetX={largura / 2}
      offsetY={altura / 2}
      width={largura}
      height={altura}
      draggable={arrastavel}
      onMouseDown={onSelecionar}
      onTouchStart={onSelecionar}
      onDragEnd={onArrastar}
    >
      <Rect
        width={largura}
        height={altura}
        fill="rgba(255,203,5,0.06)"
        stroke={CORES.ouro}
        strokeWidth={3}
        dash={[16, 12]}
      />
      <Text
        width={largura}
        height={altura}
        text={rotulo}
        align="center"
        verticalAlign="middle"
        fontSize={Math.max(18, Math.min(42, largura * 0.08))}
        fontFamily="system-ui, sans-serif"
        fill={CORES.ouro}
        listening={false}
      />
    </Group>
  );
}
