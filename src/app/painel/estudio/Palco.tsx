"use client";

import Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { useEffect, useRef, useState, type RefObject } from "react";
import { Layer, Line, Rect, Stage, Transformer } from "react-konva";
import Avatar from "./camadas/Avatar";
import Foto from "./camadas/Foto";
import Fundo from "./camadas/Fundo";
import Moldura from "./camadas/Moldura";
import Pessoa from "./camadas/Pessoa";
import Sombreado from "./camadas/Sombreado";
import Texto from "./camadas/Texto";
import { CORES } from "./paleta";
import { FORMATOS, transformavel, type Camada, type Projeto } from "./tipos";

const TOLERANCIA = 7; // px de projeto para o ímã pegar
const COR_GUIA = "#FF3DDB";

interface Props {
  projeto: Projeto;
  selecionado: string | null;
  onSelecionar: (id: string | null) => void;
  onAlterar: (id: string, mudanca: Partial<Camada>) => void;
  onFimDeGesto: () => void;
  zoom: number;
  onZoom: (z: number) => void;
  palcoRef: RefObject<Konva.Stage | null>;
  /** cresce quando as fontes carregam, forçando remedição dos textos */
  selo: number;
  /** desliga seleção e guias na hora de exportar */
  exportando: boolean;
}

interface Guia {
  eixo: "x" | "y";
  pos: number;
}

export default function Palco({
  projeto,
  selecionado,
  onSelecionar,
  onAlterar,
  onFimDeGesto,
  zoom,
  onZoom,
  palcoRef,
  selo,
  exportando,
}: Props) {
  const { largura: L, altura: A } = FORMATOS[projeto.formato];
  const transformadorRef = useRef<Konva.Transformer>(null);
  const camadaRef = useRef<Konva.Layer>(null);
  const [guias, setGuias] = useState<Guia[]>([]);

  const camadaSelecionada = projeto.camadas.find((c) => c.id === selecionado) ?? null;
  const podeTransformar =
    !exportando && !!camadaSelecionada && transformavel(camadaSelecionada) && !camadaSelecionada.travada;

  /* prende as alças ao nó selecionado */
  useEffect(() => {
    const tr = transformadorRef.current;
    const palco = palcoRef.current;
    if (!tr || !palco) return;

    const no = podeTransformar && selecionado ? palco.findOne(`#${selecionado}`) : null;
    tr.nodes(no ? [no] : []);
    tr.getLayer()?.batchDraw();
  }, [selecionado, podeTransformar, palcoRef, projeto.camadas, selo]);

  /* ímã: encosta em centro e bordas da arte enquanto arrasta */
  const aoMover = (e: KonvaEventObject<DragEvent>) => {
    const no = e.target;
    if (no === e.currentTarget) return;

    const caixa = no.getClientRect({ relativeTo: camadaRef.current ?? undefined });
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
      [0, L / 2, L],
      (d) => no.x(no.x() + d),
    );
    encaixar(
      "y",
      [caixa.y, caixa.y + caixa.height / 2, caixa.y + caixa.height],
      [0, A / 3, A / 2, (A * 2) / 3, A],
      (d) => no.y(no.y() + d),
    );

    setGuias(achados);
  };

  const aoSoltar = () => {
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

  const props = (c: Camada) => ({
    selecionada: c.id === selecionado,
    onSelecionar: () => !exportando && onSelecionar(c.id),
    interativo: !exportando,
  });

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
      <Layer ref={camadaRef} onDragMove={aoMover} onDragEnd={aoSoltar}>
        {projeto.camadas.map((c) => {
          switch (c.tipo) {
            case "fundo":
              return (
                <Fundo key={c.id} camada={c} largura={L} altura={A} {...props(c)} />
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
      <Layer listening={!exportando}>
        {!exportando &&
          projeto.formato === "9:16" &&
          [A * 0.08, A * 0.88].map((y) => (
            <Line
              key={`seguranca-${y}`}
              points={[0, y, L, y]}
              stroke="rgba(255,255,255,.25)"
              strokeWidth={1 / zoom}
              dash={[10 / zoom, 10 / zoom]}
              listening={false}
            />
          ))}

        {!exportando &&
          guias.map((g, i) => (
            <Line
              key={`${g.eixo}-${i}`}
              points={g.eixo === "x" ? [g.pos, 0, g.pos, A] : [0, g.pos, L, g.pos]}
              stroke={COR_GUIA}
              strokeWidth={1 / zoom}
              listening={false}
            />
          ))}

        {!exportando && (
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
          rotateEnabled={!!camadaSelecionada && camadaSelecionada.tipo !== "avatar"}
          keepRatio={camadaSelecionada?.tipo !== "foto"}
          enabledAnchors={
            camadaSelecionada?.tipo === "texto"
              ? ["middle-left", "middle-right"]
              : undefined
          }
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
