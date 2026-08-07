"use client";

import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { Shape } from "react-konva";
import type { CamadaPadrao } from "../tipos";

interface Props {
  camada: CamadaPadrao;
  largura: number;
  altura: number;
  onSelecionar: (e?: KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

/**
 * Geometria repetida no fundo — o X gigante em ouro escuro das referências.
 *
 * Fica logo atrás de tudo, em opacidade baixa. É o que tira o fundo do "preto
 * liso" e dá o que o olho lê como profundidade, sem competir com o título nem
 * com as pessoas.
 *
 * Desenha direto no contexto 2D em vez de virar bitmap: são algumas dezenas de
 * traços, mais barato que cachear e reescalar uma imagem a cada mudança.
 */
export default function Padrao({ camada, largura, altura, onSelecionar }: Props) {
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
        desenhar(nativo, camada, largura, altura);
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

function desenhar(
  ctx: CanvasRenderingContext2D,
  camada: CamadaPadrao,
  largura: number,
  altura: number,
) {
  const passo = Math.max(8, camada.escala);
  const diagonal = Math.hypot(largura, altura);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, largura, altura);
  ctx.clip();

  // gira em torno do centro e desenha numa área folgada, para não sobrar canto vazio
  ctx.translate(largura / 2, altura / 2);
  ctx.rotate((camada.angulo * Math.PI) / 180);

  ctx.strokeStyle = camada.cor;
  ctx.fillStyle = camada.cor;
  ctx.lineWidth = camada.espessura;
  ctx.lineCap = "square";

  const meia = diagonal / 2 + passo;

  switch (camada.forma) {
    case "chevron": {
      /* setas encaixadas uma na outra, abrindo do centro — o X das referências */
      for (let d = -meia; d <= meia; d += passo) {
        ctx.beginPath();
        ctx.moveTo(-meia, d - meia);
        ctx.lineTo(0, d);
        ctx.lineTo(meia, d - meia);
        ctx.stroke();
      }
      break;
    }

    case "raios": {
      /* leque saindo de um ponto só, como o brilho por trás de um anúncio */
      const quantos = Math.max(6, Math.round(360 / Math.max(4, camada.escala / 6)));
      for (let i = 0; i < quantos; i++) {
        // um raio sim, outro não: o vão entre eles é o que faz o desenho
        if (i % 2) continue;
        const a1 = (i / quantos) * Math.PI * 2;
        const a2 = ((i + 1) / quantos) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(a1) * meia, Math.sin(a1) * meia);
        ctx.lineTo(Math.cos(a2) * meia, Math.sin(a2) * meia);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }

    case "diagonais": {
      for (let d = -meia * 2; d <= meia * 2; d += passo) {
        ctx.beginPath();
        ctx.moveTo(d, -meia);
        ctx.lineTo(d + meia * 2, meia);
        ctx.stroke();
      }
      break;
    }

    case "grade": {
      for (let d = -meia; d <= meia; d += passo) {
        ctx.beginPath();
        ctx.moveTo(d, -meia);
        ctx.lineTo(d, meia);
        ctx.moveTo(-meia, d);
        ctx.lineTo(meia, d);
        ctx.stroke();
      }
      break;
    }

    case "pontos": {
      const raio = Math.max(0.5, camada.espessura / 2);
      for (let y = -meia; y <= meia; y += passo) {
        for (let x = -meia; x <= meia; x += passo) {
          ctx.beginPath();
          ctx.arc(x, y, raio, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }
  }

  ctx.restore();
}
