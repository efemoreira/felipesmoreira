"use client";

import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Layer, Line, Rect, Stage, Transformer } from "react-konva";
import Avatar from "./camadas/Avatar";
import Foto from "./camadas/Foto";
import Fundo from "./camadas/Fundo";
import Moldura from "./camadas/Moldura";
import Padrao from "./camadas/Padrao";
import Pessoa from "./camadas/Pessoa";
import Sombreado from "./camadas/Sombreado";
import Textura from "./camadas/Textura";
import Texto from "./camadas/Texto";
import { CORES } from "./paleta";
import { dimensoes, transformavel, type Camada, type Formato, type Projeto } from "./tipos";

const TOLERANCIA = 7; // px de projeto para o ímã pegar
const COR_GUIA = "#FF3DDB";

/**
 * Onde a interface de cada rede cobre a arte.
 *
 * Fração da altura (ou da largura, quando indicado) que fica escondida atrás de
 * botões e legendas. Antes só o 9:16 tinha isso, fixo no meio do desenho.
 */
const SEGURANCA: Partial<Record<Formato, { y?: number[]; x?: number[] }>> = {
  "9:16": { y: [0.08, 0.88] },
  "4:5": { y: [0.06, 0.94] },
  "1:1": { y: [0.06, 0.94] },
  // miniatura de vídeo: o relógio ocupa a quina de baixo à direita
  "16:9": { y: [0.06, 0.9], x: [0.04, 0.96] },
  "1.91:1": { y: [0.08, 0.92], x: [0.05, 0.95] },
};

interface Props {
  projeto: Projeto;
  selecionados: string[];
  onSelecionar: (id: string | null, juntar?: boolean) => void;
  onAlterar: (id: string, mudanca: Partial<Camada>) => void;
  onFimDeGesto: () => void;
  zoom: number;
  onZoom: (z: number) => void;
  palcoRef: RefObject<Konva.Stage | null>;
  /** cresce quando as fontes carregam, forçando remedição dos textos */
  selo: number;
  /** 0 enquanto se edita; na exportação, a escala do PNG (1 ou 2) */
  escalaExport: number;
  /** esconde guias, moldura e alças sem exportar */
  previa: boolean;
  guiasVisiveis: boolean;
}

interface Guia {
  eixo: "x" | "y";
  pos: number;
}

export default function Palco({
  projeto,
  selecionados,
  onSelecionar,
  onAlterar,
  onFimDeGesto,
  zoom,
  onZoom,
  palcoRef,
  selo,
  escalaExport,
  previa,
  guiasVisiveis,
}: Props) {
  const { largura: L, altura: A } = dimensoes(projeto);
  const transformadorRef = useRef<Konva.Transformer>(null);
  const camadaRef = useRef<Konva.Layer>(null);
  const [guias, setGuias] = useState<Guia[]>([]);
  /** posição de onde o arrasto começou, para travar o eixo com Shift */
  const inicioArrasto = useRef<{ x: number; y: number } | null>(null);

  const exportando = escalaExport > 0;
  const limpo = exportando || previa;

  const escolhidas = projeto.camadas.filter((c) => selecionados.includes(c.id));
  const podeTransformar =
    !limpo && escolhidas.length > 0 && escolhidas.every((c) => transformavel(c) && !c.travada);
  const unica = escolhidas.length === 1 ? escolhidas[0] : null;

  /* prende as alças aos nós selecionados */
  useEffect(() => {
    const tr = transformadorRef.current;
    const palco = palcoRef.current;
    if (!tr || !palco) return;

    const nos = podeTransformar
      ? selecionados
          .map((id) => palco.findOne(`#${id}`))
          .filter((n): n is Konva.Node => Boolean(n))
      : [];
    tr.nodes(nos);
    tr.getLayer()?.batchDraw();
  }, [selecionados, podeTransformar, palcoRef, projeto.camadas, selo]);

  /* ímã: encosta em centro e bordas da arte e das outras camadas */
  const aoMover = (e: KonvaEventObject<DragEvent>) => {
    const no = e.target;
    if (no === e.currentTarget) return;

    const relativeTo = camadaRef.current ?? undefined;
    // skipShadow: com halo ou sombra ligados a caixa vinha inflada, e o "centro"
    // que o ímã encontrava ficava deslocado do desenho de verdade
    const caixa = no.getClientRect({ relativeTo, skipShadow: true, skipStroke: true });

    /* trava de eixo: com Shift o arrasto anda só na direção que começou */
    const inicio = inicioArrasto.current;
    if (e.evt?.shiftKey && inicio) {
      const dx = Math.abs(no.x() - inicio.x);
      const dy = Math.abs(no.y() - inicio.y);
      if (dx > dy) no.y(inicio.y);
      else no.x(inicio.x);
    }

    /* alvos: as bordas e o centro da arte, mais as das outras camadas */
    const alvosX = [0, L / 2, L];
    const alvosY = [0, A / 3, A / 2, (A * 2) / 3, A];
    for (const outra of projeto.camadas) {
      if (selecionados.includes(outra.id) || !outra.visivel) continue;
      const noOutro = palcoRef.current?.findOne(`#${outra.id}`);
      if (!noOutro) continue;
      const c = noOutro.getClientRect({ relativeTo, skipShadow: true, skipStroke: true });
      if (c.width < 1 || c.height < 1) continue;
      alvosX.push(c.x, c.x + c.width / 2, c.x + c.width);
      alvosY.push(c.y, c.y + c.height / 2, c.y + c.height);
    }

    const achados: Guia[] = [];
    const encaixar = (
      eixo: "x" | "y",
      bordas: number[],
      alvos: number[],
      aplicar: (delta: number) => void,
    ) => {
      let melhor: { delta: number; alvo: number } | null = null;
      for (const alvo of alvos) {
        for (const borda of bordas) {
          const delta = alvo - borda;
          if (Math.abs(delta) <= TOLERANCIA && (!melhor || Math.abs(delta) < Math.abs(melhor.delta))) {
            melhor = { delta, alvo };
          }
        }
      }
      if (melhor) {
        aplicar(melhor.delta);
        achados.push({ eixo, pos: melhor.alvo });
      }
    };

    encaixar(
      "x",
      [caixa.x, caixa.x + caixa.width / 2, caixa.x + caixa.width],
      alvosX,
      (d) => no.x(no.x() + d),
    );
    encaixar(
      "y",
      [caixa.y, caixa.y + caixa.height / 2, caixa.y + caixa.height],
      alvosY,
      (d) => no.y(no.y() + d),
    );

    setGuias(achados);
  };

  const aoSoltar = () => {
    inicioArrasto.current = null;
    setGuias([]);
    onFimDeGesto();
  };

  /* ctrl/⌘ + roda dá zoom; roda sozinha rola a área */
  const aoRolar = (e: KonvaEventObject<WheelEvent>) => {
    if (!e.evt.ctrlKey && !e.evt.metaKey) return;
    e.evt.preventDefault();
    const passo = e.evt.deltaY > 0 ? 0.9 : 1.1;
    onZoom(Math.min(1.5, Math.max(0.08, zoom * passo)));
  };

  /**
   * Alt+clique pega a camada de baixo.
   *
   * O Konva entrega sempre a de cima; sem isto, uma pessoa coberta por um texto
   * (ou pelo próprio fantasma) fica impossível de selecionar pelo palco.
   */
  const alvoDoClique = (e: KonvaEventObject<MouseEvent | TouchEvent>, id: string) => {
    const evt = e.evt as MouseEvent;
    if (!evt?.altKey) return id;

    const palco = palcoRef.current;
    const ponto = palco?.getPointerPosition();
    if (!palco || !ponto) return id;

    // da frente para trás, a primeira cuja caixa pega o ponto depois da atual
    const ordem = [...projeto.camadas].reverse();
    const atual = ordem.findIndex((c) => c.id === id);
    for (let i = atual + 1; i < ordem.length; i++) {
      const c = ordem[i];
      if (!c.visivel || c.travada || !transformavel(c)) continue;
      const no = palco.findOne(`#${c.id}`);
      if (!no) continue;
      const r = no.getClientRect({ skipShadow: true, skipStroke: true });
      if (ponto.x >= r.x && ponto.x <= r.x + r.width && ponto.y >= r.y && ponto.y <= r.y + r.height) {
        return c.id;
      }
    }
    return id;
  };

  const props = (c: Camada) => ({
    selecionada: selecionados.includes(c.id),
    onSelecionar: (e?: KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (limpo) return;
      const evt = e?.evt as MouseEvent | undefined;
      onSelecionar(e ? alvoDoClique(e, c.id) : c.id, !!(evt?.shiftKey || evt?.metaKey || evt?.ctrlKey));
    },
    interativo: !limpo,
    qualidade: escalaExport || 1,
  });

  const seguranca = SEGURANCA[projeto.formato];

  return (
    <Stage
      ref={palcoRef}
      width={L * zoom}
      height={A * zoom}
      scaleX={zoom}
      scaleY={zoom}
      onWheel={aoRolar}
      onMouseDown={(e) => {
        if (e.target === e.target.getStage()) onSelecionar(null);
      }}
      onTouchStart={(e) => {
        if (e.target === e.target.getStage()) onSelecionar(null);
      }}
      style={{ background: CORES.noite }}
    >
      <Layer
        ref={camadaRef}
        onDragStart={(e) => {
          inicioArrasto.current = { x: e.target.x(), y: e.target.y() };
        }}
        onDragMove={aoMover}
        onDragEnd={aoSoltar}
      >
        {projeto.camadas.map((c) => {
          switch (c.tipo) {
            case "fundo":
              return (
                <Fundo key={c.id} camada={c} largura={L} altura={A} {...props(c)} />
              );
            case "padrao":
              return (
                <Padrao key={c.id} camada={c} largura={L} altura={A} {...props(c)} />
              );
            case "textura":
              return (
                <Textura key={c.id} camada={c} largura={L} altura={A} {...props(c)} />
              );
            case "sombreado":
              return (
                <Sombreado key={c.id} camada={c} largura={L} altura={A} {...props(c)} />
              );
            case "moldura":
              return (
                <Moldura key={c.id} camada={c} largura={L} altura={A} {...props(c)} />
              );
            case "foto":
              return (
                <Foto
                  key={c.id}
                  camada={c}
                  onAlterar={(m) => onAlterar(c.id, m)}
                  {...props(c)}
                />
              );
            case "pessoa":
              return (
                <Pessoa
                  key={c.id}
                  camada={c}
                  onAlterar={(m) => onAlterar(c.id, m)}
                  {...props(c)}
                />
              );
            case "avatar":
              return (
                <Avatar
                  key={c.id}
                  camada={c}
                  onAlterar={(m) => onAlterar(c.id, m)}
                  {...props(c)}
                />
              );
            case "texto":
              return (
                <Texto
                  key={c.id}
                  camada={c}
                  selo={selo}
                  onAlterar={(m) => onAlterar(c.id, m)}
                  {...props(c)}
                />
              );
          }
        })}
      </Layer>

      {/* guias e alças ficam numa camada própria: nunca entram na exportação */}
      <Layer listening={!limpo}>
        {!limpo &&
          guiasVisiveis &&
          (seguranca?.y ?? []).map((f) => (
            <Line
              key={`seg-y-${f}`}
              points={[0, A * f, L, A * f]}
              stroke="rgba(255,255,255,.25)"
              strokeWidth={1 / zoom}
              dash={[10 / zoom, 10 / zoom]}
              listening={false}
            />
          ))}

        {!limpo &&
          guiasVisiveis &&
          (seguranca?.x ?? []).map((f) => (
            <Line
              key={`seg-x-${f}`}
              points={[L * f, 0, L * f, A]}
              stroke="rgba(255,255,255,.25)"
              strokeWidth={1 / zoom}
              dash={[10 / zoom, 10 / zoom]}
              listening={false}
            />
          ))}

        {!limpo &&
          guias.map((g, i) => (
            <Line
              key={`${g.eixo}-${i}`}
              points={g.eixo === "x" ? [g.pos, 0, g.pos, A] : [0, g.pos, L, g.pos]}
              stroke={COR_GUIA}
              strokeWidth={1 / zoom}
              listening={false}
            />
          ))}

        {!limpo && (
          <Rect
            x={0}
            y={0}
            width={L}
            height={A}
            stroke="rgba(255,255,255,.14)"
            strokeWidth={1 / zoom}
            listening={false}
          />
        )}

        <Transformer
          ref={transformadorRef}
          visible={podeTransformar}
          rotateEnabled={!!unica && unica.tipo !== "avatar"}
          /* imagem nunca distorce por acidente; com Shift o artista força */
          keepRatio={unica?.tipo !== "texto"}
          shiftBehavior="inverted"
          enabledAnchors={unica?.tipo === "texto" ? ["middle-left", "middle-right"] : undefined}
          anchorSize={10 / zoom}
          anchorStroke={CORES.noite}
          anchorFill={CORES.ouro}
          borderStroke={CORES.ouro}
          borderStrokeWidth={1.5 / zoom}
          rotateAnchorOffset={30 / zoom}
          onTransformEnd={onFimDeGesto}
          boundBoxFunc={(antiga, nova) =>
            Math.abs(nova.width) < 16 || Math.abs(nova.height) < 16 ? antiga : nova
          }
        />
      </Layer>
    </Stage>
  );
}
