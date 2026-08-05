"use client";

/**
 * Carrega a imagem de um ativo da biblioteca para o Konva.
 * O Konva precisa de um HTMLImageElement já carregado — enquanto não estiver,
 * a camada desenha o espaço reservado.
 */
import { useEffect, useState } from "react";
import { urlDoAtivo } from "./armazenamento";

const cache = new Map<string, HTMLImageElement>();

export function useImagem(ativoId: string): HTMLImageElement | null {
  const [img, setImg] = useState<HTMLImageElement | null>(() => cache.get(ativoId) ?? null);

  useEffect(() => {
    if (!ativoId) {
      setImg(null);
      return;
    }
    const guardada = cache.get(ativoId);
    if (guardada) {
      setImg(guardada);
      return;
    }

    let ativo = true;
    urlDoAtivo(ativoId).then((url) => {
      if (!ativo || !url) return;
      const elemento = new Image();
      elemento.onload = () => {
        cache.set(ativoId, elemento);
        if (ativo) setImg(elemento);
      };
      elemento.src = url;
    });

    return () => {
      ativo = false;
    };
  }, [ativoId]);

  return img;
}
