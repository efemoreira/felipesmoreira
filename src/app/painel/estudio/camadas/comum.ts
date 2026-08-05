"use client";

/** Peças que todas as camadas do palco compartilham. */
import Konva from "konva";
import { useEffect, type RefObject } from "react";
import type { Filter, KonvaEventObject } from "konva/lib/Node";
import { Esmaecer, Gradiente, Tinta } from "../filtros";
import type { Ajustes, Camada } from "../tipos";

export interface PropsCamada<T extends Camada> {
  camada: T;
  selecionada: boolean;
  onSelecionar: () => void;
  onAlterar: (mudanca: Partial<T>) => void;
  /** durante a exportação nada é clicável nem arrastável */
  interativo: boolean;
}

/** Monta a lista de filtros do Konva a partir dos ajustes da camada. */
export function filtrosDe(
  ajustes: Ajustes,
  extras: { tinta?: boolean; gradiente?: boolean; esmaecer?: boolean } = {},
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

/**
 * Filtro no Konva só roda em nó cacheado, e o cache é caro.
 * Então: recacheia com um respiro depois da última mudança, nunca a cada frame.
 */
export function useCacheFiltros(
  ref: RefObject<Konva.Node | null>,
  precisa: boolean,
  chave: string,
) {
  useEffect(() => {
    const no = ref.current;
    if (!no) return;

    if (!precisa) {
      no.clearCache();
      no.getLayer()?.batchDraw();
      return;
    }

    const id = window.setTimeout(() => {
      no.cache({ pixelRatio: 1 });
      no.getLayer()?.batchDraw();
    }, 90);
    return () => window.clearTimeout(id);
  }, [ref, precisa, chave]);
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
