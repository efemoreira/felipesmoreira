"use client";

import Konva from "konva";
import { useRef } from "react";
import { Group, Image as ImagemKonva, Shape } from "react-konva";
import { Halo, hexParaRgb } from "../filtros";
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
 * referências: a silhueta colorida (para virar vulto preto, ouro ou branco), o
 * halo de luz atrás do recorte, a luz de contorno que corre pela borda do corpo
 * e a sombra de contato no chão.
 *
 * A ordem de desenho dentro do grupo é: contato → halo → recorte. É o que faz a
 * pessoa parecer apoiada e iluminada, e não colada por cima do fundo.
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

  const { ajustes, tinta, gradiente, sombra, luzBorda, contato } = camada;
  const filtros = filtrosDe(ajustes, {
    tinta: tinta.ativa,
    gradiente: gradiente.ativo,
    luzBorda: luzBorda.ativa && luzBorda.forca > 0,
    esmaecer: esmaeceAlgo(camada.esmaecer),
  });
  const precisaCache = filtros.length > 0;

  /* o halo cresce para fora do desenho: o cache precisa da mesma folga */
  const folgaHalo = camada.halo.tamanho + camada.halo.desfoque;

  useCacheFiltros(
    principal,
    precisaCache && !!img,
    `${camada.ativoId}|${camada.largura}x${camada.altura}|${JSON.stringify(ajustes)}|${JSON.stringify(tinta)}|${JSON.stringify(gradiente)}|${JSON.stringify(camada.esmaecer)}|${JSON.stringify(luzBorda)}`,
    qualidade,
  );
  useCacheFiltros(
    halo,
    camada.halo.ativo && !!img,
    `${camada.ativoId}|${camada.largura}x${camada.altura}|${JSON.stringify(camada.halo)}`,
    qualidade,
    folgaHalo,
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
      {/* sombra de contato: a mancha no chão, colada na base do recorte */}
      {contato.ativa && contato.forca > 0 && (
        <Shape
          listening={false}
          sceneFunc={(ctx: Konva.Context) => {
            const nativo = (ctx as unknown as { _context: CanvasRenderingContext2D })._context;
            const raioX = (camada.largura * contato.largura) / 2;
            const raioY = raioX * contato.altura;
            if (raioX <= 0 || raioY <= 0) return;
            const [r, g, b] = hexParaRgb(contato.cor);

            /* um gradiente radial achatado pela escala: assim a mancha não tem
               miolo chapado nem borda dura, que é o que denuncia sombra falsa */
            nativo.save();
            nativo.translate(camada.largura / 2, camada.altura);
            nativo.scale(1, raioY / raioX);
            const luz = nativo.createRadialGradient(0, 0, 0, 0, 0, raioX);
            luz.addColorStop(0, `rgba(${r},${g},${b},${contato.forca})`);
            luz.addColorStop(0.55, `rgba(${r},${g},${b},${contato.forca * 0.45})`);
            luz.addColorStop(1, `rgba(${r},${g},${b},0)`);
            nativo.fillStyle = luz;
            nativo.beginPath();
            nativo.arc(0, 0, raioX, 0, Math.PI * 2);
            nativo.fill();
            nativo.restore();
          }}
        />
      )}

      {/* halo: a mesma silhueta, dilatada no alfa e pintada de uma cor só */}
      {camada.halo.ativo && (
        <ImagemKonva
          ref={halo}
          image={img}
          {...tamanho}
          listening={false}
          filters={[Halo]}
          haloCor={camada.halo.cor}
          haloTamanho={camada.halo.tamanho}
          haloDesfoque={camada.halo.desfoque}
          haloForca={camada.halo.forca}
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
        luzCor={luzBorda.cor}
        luzAngulo={luzBorda.angulo}
        luzEspessura={luzBorda.espessura}
        luzForca={luzBorda.ativa ? luzBorda.forca : 0}
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
