"use client";

/** Peças que todas as camadas do palco compartilham. */
import Konva from "konva";
import { useEffect, type RefObject } from "react";
import type { Filter, KonvaEventObject } from "konva/lib/Node";
import { Esmaecer, Gradiente, LuzBorda, Tinta } from "../filtros";
import type { Ajustes, Camada, Esmaecimento } from "../tipos";

export interface PropsCamada<T extends Camada> {
  camada: T;
  selecionada: boolean;
  /** recebe o evento para ler Shift (juntar à seleção) e Alt (pegar a de baixo) */
  onSelecionar: (e?: KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onAlterar: (mudanca: Partial<T>) => void;
  /** durante a exportação nada é clicável nem arrastável */
  interativo: boolean;
  /**
   * Resolução do cache de filtro. É 1 enquanto se edita e sobe para a escala da
   * exportação na hora de gerar o PNG — sem isso o 2× amplia um bitmap 1× e sai
   * borrado justamente nas camadas trabalhadas.
   */
  qualidade: number;
}

/** Um esmaecimento só entra na conta se tiver alguma borda ligada. */
export const esmaeceAlgo = (e: Esmaecimento | undefined): boolean =>
  !!e?.ativo &&
  (e.modo === "elipse" ||
    e.topo > 0 ||
    e.direita > 0 ||
    e.base > 0 ||
    e.esquerda > 0 ||
    e.cantos > 0);

/** Monta a lista de filtros do Konva a partir dos ajustes da camada. */
export function filtrosDe(
  ajustes: Ajustes,
  extras: { tinta?: boolean; gradiente?: boolean; esmaecer?: boolean; luzBorda?: boolean } = {},
): Filter[] {
  const filtros: Filter[] = [];
  if (ajustes.desfoque > 0) filtros.push(Konva.Filters.Blur);
  if (ajustes.cinza) filtros.push(Konva.Filters.Grayscale);
  if (ajustes.saturacao !== 0) filtros.push(Konva.Filters.HSL);
  if (ajustes.brilho !== 0) filtros.push(Konva.Filters.Brighten);
  if (ajustes.contraste !== 0) filtros.push(Konva.Filters.Contrast);
  if (extras.tinta) filtros.push(Tinta);
  // depois da tinta: o gradiente também pinta, e precisa vir por cima dela
  if (extras.gradiente) filtros.push(Gradiente);
  // a luz de contorno lê o alfa ainda inteiro, antes de o esmaecer comer as bordas
  if (extras.luzBorda) filtros.push(LuzBorda);
  // por último: o esmaecer só corta alfa, então nada depois dele repinta o que sumiu
  if (extras.esmaecer) filtros.push(Esmaecer);
  return filtros;
}

/** Atributos que os filtros do Konva leem direto do nó. */
export function atributosDeAjuste(ajustes: Ajustes) {
  return {
    blurRadius: ajustes.desfoque,
    saturation: ajustes.saturacao,
    brightness: ajustes.brilho,
    contrast: ajustes.contraste,
  };
}

/** Atributos do filtro Esmaecer, lidos do nó pelo Konva. */
export function atributosDeEsmaecer(e: Esmaecimento) {
  return {
    esmaecerModo: e.modo,
    esmaecerTopo: e.topo,
    esmaecerDireita: e.direita,
    esmaecerBase: e.base,
    esmaecerEsquerda: e.esquerda,
    esmaecerCantos: e.cantos,
    esmaecerDureza: e.dureza,
  };
}

/**
 * Filtro no Konva só roda em nó cacheado, e o cache é caro.
 * Então: recacheia com um respiro depois da última mudança, nunca a cada frame.
 *
 * A `qualidade` entra na chave de propósito: quando a exportação sobe para 2×,
 * o cache precisa ser refeito naquela resolução antes do `toDataURL`.
 */
export function useCacheFiltros(
  ref: RefObject<Konva.Node | null>,
  precisa: boolean,
  chave: string,
  qualidade = 1,
  /**
   * Folga em px em volta do nó ao cachear. O halo dilata o alfa para fora do
   * desenho original; sem esta folga o Konva recorta o cache na caixa do nó e a
   * luz aparece cortada em linha reta nas bordas.
   */
  folga = 0,
) {
  useEffect(() => {
    const no = ref.current;
    if (!no) return;

    if (!precisa) {
      no.clearCache();
      no.getLayer()?.batchDraw();
      return;
    }

    const opcoes = folga > 0 ? { offset: Math.ceil(folga) } : {};

    // na exportação não dá para esperar: o PNG é gerado dois quadros depois
    if (qualidade > 1) {
      no.cache({ ...opcoes, pixelRatio: qualidade });
      no.getLayer()?.batchDraw();
      return;
    }

    const id = window.setTimeout(() => {
      no.cache({ ...opcoes, pixelRatio: 1 });
      no.getLayer()?.batchDraw();
    }, 90);
    return () => window.clearTimeout(id);
  }, [ref, precisa, chave, qualidade, folga]);
}

/** Ao girar/redimensionar, o Konva mexe na escala; aqui ela volta para o tamanho. */
export function aoTransformar(
  camada: { largura: number; altura: number; espelhado?: boolean },
  onAlterar: (m: Record<string, number>) => void,
) {
  return (e: KonvaEventObject<Event>) => {
    const no = e.target;
    const ex = Math.abs(no.scaleX());
    const ey = Math.abs(no.scaleY());
    no.scaleX(camada.espelhado ? -1 : 1);
    no.scaleY(1);
    onAlterar({
      x: no.x(),
      y: no.y(),
      rotacao: no.rotation(),
      largura: Math.max(8, Math.round(camada.largura * ex)),
      altura: Math.max(8, Math.round(camada.altura * ey)),
    });
  };
}

export function aoArrastar(onAlterar: (m: { x: number; y: number }) => void) {
  return (e: KonvaEventObject<DragEvent>) =>
    onAlterar({ x: Math.round(e.target.x()), y: Math.round(e.target.y()) });
}
