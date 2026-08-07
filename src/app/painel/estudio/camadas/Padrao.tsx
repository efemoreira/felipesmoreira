"use client";

import type Konva from "konva";
import { Shape } from "react-konva";
import type { CamadaPadrao } from "../tipos";
import type { PropsDecorativa } from "./comum";

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
export default function Padrao({ camada, largura, altura }: PropsDecorativa<CamadaPadrao>) {
  return (
    <Shape
      id={camada.id}
      x={0}
      y={0}
      width={largura}
      height={altura}
      visible={camada.visivel}
      opacity={camada.opacidade}
      listening={false}
      globalCompositeOperation={
        camada.mistura === "normal" ? undefined : (camada.mistura as GlobalCompositeOperation)
      }
      sceneFunc={(ctx: Konva.Context) => {
        const nativo = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;
        desenhar(nativo, camada, largura, altura);
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
  /* os motivos que varrem uma grade de duas dimensões custam o quadrado do que
     custa uma linha: com passo de 8px numa arte grande dariam dezenas de
     milhares de caminhos por quadro. O piso mais alto é o que segura o palco. */
  const passoDenso = Math.max(16, passo);

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

    case "ondas": {
      /* a onda é desenhada em segmentos curtos; abaixo disso o traço fica
         poligonal e o desenho denuncia que foi feito no braço */
      const amplitude = passo / 4;
      const periodo = Math.max(8, passo * 1.5);
      for (let y = -meia; y <= meia; y += passo) {
        ctx.beginPath();
        for (let x = -meia, primeiro = true; x <= meia; x += 4, primeiro = false) {
          const py = y + Math.sin((x / periodo) * Math.PI * 2) * amplitude;
          if (primeiro) ctx.moveTo(x, py);
          else ctx.lineTo(x, py);
        }
        ctx.stroke();
      }
      break;
    }

    case "ziguezague": {
      const meiaOnda = Math.max(6, passo / 2);
      const altura = passo / 3;
      for (let y = -meia; y <= meia; y += passo) {
        ctx.beginPath();
        ctx.moveTo(-meia, y);
        let cima = true;
        for (let x = -meia; x <= meia; x += meiaOnda, cima = !cima) {
          ctx.lineTo(x + meiaOnda, y + (cima ? -altura : altura));
        }
        ctx.stroke();
      }
      break;
    }

    case "triangulos": {
      const lado = passoDenso;
      const alt = (lado * Math.sqrt(3)) / 2;
      let linha = 0;
      for (let y = -meia; y <= meia; y += alt, linha++) {
        // fileira sim, fileira não sai deslocada: é o que encaixa os triângulos
        const desloca = linha % 2 ? lado / 2 : 0;
        for (let x = -meia; x <= meia; x += lado) {
          ctx.beginPath();
          ctx.moveTo(x + desloca, y + alt);
          ctx.lineTo(x + desloca + lado / 2, y);
          ctx.lineTo(x + desloca + lado, y + alt);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }

    case "hexagonos": {
      const raio = passoDenso / 2;
      const dx = Math.sqrt(3) * raio;
      const dy = 1.5 * raio;
      let linha = 0;
      for (let y = -meia; y <= meia; y += dy, linha++) {
        const desloca = linha % 2 ? dx / 2 : 0;
        for (let x = -meia; x <= meia; x += dx) {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            // -30° deixa o hexágono de ponta para cima, que é como colmeia se lê
            const a = ((60 * i - 30) * Math.PI) / 180;
            const px = x + desloca + raio * Math.cos(a);
            const py = y + raio * Math.sin(a);
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }

    case "xadrez": {
      let linha = 0;
      for (let y = -meia; y <= meia; y += passoDenso, linha++) {
        let coluna = 0;
        for (let x = -meia; x <= meia; x += passoDenso, coluna++) {
          if ((linha + coluna) % 2) continue;
          ctx.fillRect(x, y, passoDenso, passoDenso);
        }
      }
      break;
    }

    case "concentricos": {
      for (let raio = passo; raio <= meia * 1.5; raio += passo) {
        ctx.beginPath();
        ctx.arc(0, 0, raio, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }

    case "cruzes": {
      const braco = Math.max(2, passoDenso / 5);
      for (let y = -meia; y <= meia; y += passoDenso) {
        for (let x = -meia; x <= meia; x += passoDenso) {
          ctx.beginPath();
          ctx.moveTo(x - braco, y);
          ctx.lineTo(x + braco, y);
          ctx.moveTo(x, y - braco);
          ctx.lineTo(x, y + braco);
          ctx.stroke();
        }
      }
      break;
    }
  }

  ctx.restore();
}
