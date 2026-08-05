"use client";

import { Rect } from "react-konva";
import type { CamadaMoldura } from "../tipos";

interface Props {
  camada: CamadaMoldura;
  largura: number;
  altura: number;
  onSelecionar: () => void;
}

/** Moldura dourada de cordel — simples ou dupla, como no "É OFICIAL". */
export default function Moldura({ camada, largura, altura, onSelecionar }: Props) {
  const traco = (recuo: number, espessura: number, chave: string) => (
    <Rect
      key={chave}
      id={chave === "externa" ? camada.id : `${camada.id}-${chave}`}
      x={recuo}
      y={recuo}
      width={Math.max(1, largura - recuo * 2)}
      height={Math.max(1, altura - recuo * 2)}
      cornerRadius={camada.raio}
      stroke={camada.cor}
      strokeWidth={espessura}
      visible={camada.visivel}
      opacity={camada.opacidade}
      listening={!camada.travada}
      onMouseDown={onSelecionar}
      onTouchStart={onSelecionar}
    />
  );

  return (
    <>
      {traco(camada.recuo, camada.espessura, "externa")}
      {camada.dupla &&
        traco(
          camada.recuo + camada.espessura * 2.6,
          Math.max(1, camada.espessura * 0.4),
          "interna",
        )}
    </>
  );
}
