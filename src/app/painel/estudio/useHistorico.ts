"use client";

/**
 * Desfazer/refazer por instantâneos.
 *
 * Arrastar uma camada ou puxar um slider gera dezenas de estados por segundo,
 * então nem toda mudança vira um passo: as contínuas são marcadas como
 * "efêmeras" e só entram na pilha quando o gesto termina (`fechar`).
 *
 * Passado, presente e futuro moram no mesmo estado — assim cada ação é uma
 * transição pura, sem `setState` aninhado.
 */
import { useCallback, useState } from "react";

const LIMITE = 60;

interface Linha<T> {
  passado: T[];
  presente: T;
  futuro: T[];
  /** estado anterior ao gesto em curso, ainda não virou passo */
  pendente: T | null;
}

const empilhar = <T,>(pilha: T[], item: T) => [...pilha, item].slice(-LIMITE);

export function useHistorico<T>(inicial: T) {
  const [linha, setLinha] = useState<Linha<T>>({
    passado: [],
    presente: inicial,
    futuro: [],
    pendente: null,
  });

  const aplicar = useCallback((proximo: T | ((atual: T) => T), efemera = false) => {
    setLinha((l) => {
      const novo =
        typeof proximo === "function" ? (proximo as (a: T) => T)(l.presente) : proximo;
      if (novo === l.presente) return l;

      if (efemera) {
        return { ...l, presente: novo, pendente: l.pendente ?? l.presente };
      }
      return {
        passado: empilhar(l.passado, l.pendente ?? l.presente),
        presente: novo,
        futuro: [],
        pendente: null,
      };
    });
  }, []);

  /** Fecha o gesto em curso: soltar o mouse, largar o slider. */
  const fechar = useCallback(() => {
    setLinha((l) => {
      if (l.pendente === null || l.pendente === l.presente) {
        return l.pendente === null ? l : { ...l, pendente: null };
      }
      return {
        passado: empilhar(l.passado, l.pendente),
        presente: l.presente,
        futuro: [],
        pendente: null,
      };
    });
  }, []);

  const desfazer = useCallback(() => {
    setLinha((l) => {
      if (!l.passado.length) return l;
      return {
        passado: l.passado.slice(0, -1),
        presente: l.passado[l.passado.length - 1],
        futuro: [l.presente, ...l.futuro].slice(0, LIMITE),
        pendente: null,
      };
    });
  }, []);

  const refazer = useCallback(() => {
    setLinha((l) => {
      if (!l.futuro.length) return l;
      return {
        passado: empilhar(l.passado, l.presente),
        presente: l.futuro[0],
        futuro: l.futuro.slice(1),
        pendente: null,
      };
    });
  }, []);

  /** Troca o estado sem gravar histórico — usado ao abrir um projeto salvo. */
  const substituir = useCallback((novo: T) => {
    setLinha({ passado: [], presente: novo, futuro: [], pendente: null });
  }, []);

  return {
    estado: linha.presente,
    aplicar,
    fechar,
    desfazer,
    refazer,
    substituir,
    podeDesfazer: linha.passado.length > 0,
    podeRefazer: linha.futuro.length > 0,
  };
}
