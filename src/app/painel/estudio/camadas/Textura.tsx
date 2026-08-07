"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Shape } from "react-konva";
import { texturaPronta } from "../textura";
import { useImagem } from "../useImagem";
import type { CamadaTextura } from "../tipos";

interface Props {
  camada: CamadaTextura;
  largura: number;
  altura: number;
  onSelecionar: (e?: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  /** 1 no palco, 2 na exportação — a textura é gerada nessa resolução */
  qualidade: number;
}

/**
 * Grão, riscos e desgaste por cima da arte inteira.
 *
 * É a última camada de acabamento: sozinha ela não faz nada, mas é o que separa
 * uma arte que parece impressa de uma que parece exportada de um editor.
 *
 * Com `ativoId` preenchido, ladrilha um PNG da biblioteca no lugar do desenho
 * procedural — para quem já tem uma textura de que gosta.
 */
export default function Textura({ camada, largura, altura, onSelecionar, qualidade }: Props) {
  const img = useImagem(camada.ativoId);

  return (
    <Shape
      id={camada.id}
      x={0}
      y={0}
      width={largura}
      height={altura}
      visible={camada.visivel}
      opacity={camada.opacidade}
      listening={!camada.travada}
      globalCompositeOperation={
        camada.mistura === "normal" ? undefined : (camada.mistura as GlobalCompositeOperation)
      }
      onMouseDown={onSelecionar}
      onTouchStart={onSelecionar}
      sceneFunc={(ctx: Konva.Context) => {
        const nativo = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;

        if (img) {
          const padrao = nativo.createPattern(img, "repeat");
          if (!padrao) return;
          const e = Math.max(0.1, camada.escala);
          padrao.setTransform(new DOMMatrix([e, 0, 0, e, 0, 0]));
          nativo.save();
          nativo.fillStyle = padrao;
          nativo.fillRect(0, 0, largura, altura);
          nativo.restore();
          return;
        }

        /* a resolução da exportação entra no pedido: gerar em 1× e deixar o
           Konva ampliar para 2× devolveria um grão borrado, que é o oposto */
        const pronta = texturaPronta({
          modo: camada.modo,
          semente: camada.semente,
          cor: camada.cor,
          largura: largura * qualidade,
          altura: altura * qualidade,
          escala: camada.escala * qualidade,
        });
        nativo.drawImage(pronta, 0, 0, largura, altura);
      }}
      hitFunc={(ctx: Konva.Context, shape: Konva.Shape) => {
        ctx.beginPath();
        ctx.rect(0, 0, largura, altura);
        ctx.closePath();
        ctx.fillStrokeShape(shape);
      }}
    />
  );
}
