"use client";

import Konva from "konva";
import { useRef } from "react";
import { Group, Image as ImagemKonva } from "react-konva";
import { Tinta } from "../filtros";
import { useImagem } from "../useImagem";
import type { CamadaPessoa } from "../tipos";
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
 * A pessoa recortada — a camada que carrega a arte.
 *
 * Além de posição e tamanho, é aqui que ficam os efeitos que dão o visual das
 * referências: a silhueta colorida (para virar vulto preto, ouro ou branco), a
 * sombra dura e o halo de luz atrás do recorte.
 */
export default function Pessoa({
  camada,
  onSelecionar,
  onAlterar,
  interativo,
  qualidade,
}: PropsCamada<CamadaPessoa>) {
  const img = useImagem(camada.ativoId);
  const principal = useRef<Konva.Image>(null);
  const halo = useRef<Konva.Image>(null);

  const { ajustes, tinta, gradiente, sombra } = camada;
  const filtros = filtrosDe(ajustes, {
    tinta: tinta.ativa,
    gradiente: gradiente.ativo,
    esmaecer: esmaeceAlgo(camada.esmaecer),
  });
  const precisaCache = filtros.length > 0;

  useCacheFiltros(
    principal,
    precisaCache && !!img,
    `${camada.ativoId}|${camada.largura}x${camada.altura}|${JSON.stringify(ajustes)}|${JSON.stringify(tinta)}|${JSON.stringify(gradiente)}|${JSON.stringify(camada.esmaecer)}`,
    qualidade,
  );
  useCacheFiltros(
    halo,
    camada.halo.ativo && !!img,
    `${camada.ativoId}|${camada.largura}x${camada.altura}|${JSON.stringify(camada.halo)}`,
    qualidade,
  );

  if (!img) {
    // a caixa "troque aqui" é uma ajuda de edição: não pode sair no PNG
    if (!interativo) return null;
    return (
      <Reservado
        id={camada.id}
        x={camada.x}
        y={camada.y}
        largura={camada.largura}
        altura={camada.altura}
        rotacao={camada.rotacao}
        rotulo={`${camada.nome}\n(suba um PNG sem fundo)`}
        onSelecionar={onSelecionar}
        arrastavel={interativo && !camada.travada}
        onArrastar={aoArrastar((m) => onAlterar(m))}
      />
    );
  }

  const tamanho = { width: camada.largura, height: camada.altura };
  const centro = { offsetX: camada.largura / 2, offsetY: camada.altura / 2 };
  const engorda = camada.halo.tamanho;

  return (
    <Group
      id={camada.id}
      x={camada.x}
      y={camada.y}
      rotation={camada.rotacao}
      scaleX={camada.espelhado ? -1 : 1}
      opacity={camada.opacidade}
      visible={camada.visivel}
      draggable={interativo && !camada.travada}
      listening={interativo && !camada.travada}
      onMouseDown={onSelecionar}
      onTouchStart={onSelecionar}
      onDragEnd={aoArrastar((m) => onAlterar(m))}
      onTransformEnd={aoTransformar(camada, (m) => onAlterar(m as Partial<CamadaPessoa>))}
      {...tamanho}
      {...centro}
    >
      {/* halo: a mesma silhueta, um pouco maior e desfocada, atrás do recorte */}
      {camada.halo.ativo && (
        <ImagemKonva
          ref={halo}
          image={img}
          x={-engorda}
          y={-engorda}
          width={camada.largura + engorda * 2}
          height={camada.altura + engorda * 2}
          listening={false}
          filters={[Konva.Filters.Blur, Tinta]}
          blurRadius={camada.halo.desfoque}
          tintaCor={camada.halo.cor}
          tintaForca={1}
        />
      )}

      <ImagemKonva
        ref={principal}
        image={img}
        {...tamanho}
        filters={filtros}
        {...atributosDeAjuste(ajustes)}
        {...atributosDeEsmaecer(camada.esmaecer)}
        tintaCor={tinta.cor}
        tintaForca={tinta.ativa ? tinta.forca : 0}
        gradienteModo={gradiente.modo}
        gradienteCor={gradiente.cor}
        gradienteExtensao={gradiente.extensao}
        gradienteForca={gradiente.ativo ? gradiente.forca : 0}
        shadowEnabled={sombra.ativa}
        shadowColor={sombra.cor}
        shadowOffsetX={sombra.x}
        shadowOffsetY={sombra.y}
        shadowBlur={sombra.desfoque}
        shadowOpacity={1}
        listening={false}
      />
    </Group>
  );
}
