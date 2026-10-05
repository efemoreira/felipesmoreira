"use client";
import { useEffect, useState } from "react";

/**
 * Os dados de /resultados: JSON estático em `public/resultados-2026/`, gerado
 * pelo projeto de análise (`python -m src.cli export-site`). Nada passa pelo
 * painel PHP — é resultado público do TSE, já processado.
 *
 * - `resumo.json` chega uma vez (UFs, Brasil, candidatos, ideias…);
 * - `uf/<uf>.json` (cidades) e `mapa/<nome>.json` só quando o estado é aberto,
 *   e ficam guardados na memória da aba: trocar de aba não baixa de novo.
 */

const BASE = "/resultados-2026";

/** Linha de painel: os nomes de coluna seguem o padrão `<grupo>_<cargo>` do projeto de análise. */
export type Linha = Record<string, number | string | boolean | undefined>;

export type Resumo = {
  geradoEm: string;
  fonte: string;
  brasil: Linha;
  ufs: Linha[];
  legendaPartidos: Linha[];
  numeros: Linha[];
  ideias: Linha[];
  porte: Linha[];
  candidatos: Linha[];
};

export type VotoNaCidade = { candidato_sq: string; municipio_codigo: string; votos: number };
export type DadosUf = { cidades: Linha[]; votos: VotoNaCidade[] };
export type Mapa = { largura: number; altura: number; paths: Record<string, string> };

type Tabela = { colunas: string[]; linhas: (number | string | boolean | null)[][] };

/** O export grava em colunas (nome uma vez só); aqui vira lista de objetos. */
function deTabela<T>(t: Tabela): T[] {
  return t.linhas.map((linha) => {
    const o: Record<string, unknown> = {};
    t.colunas.forEach((c, i) => {
      if (linha[i] !== null) o[c] = linha[i];
    });
    return o as T;
  });
}

const cache = new Map<string, Promise<unknown>>();

function buscar<T>(caminho: string, transformar: (bruto: unknown) => T = (b) => b as T): Promise<T> {
  if (!cache.has(caminho)) {
    const p = fetch(`${BASE}/${caminho}`)
      .then((r) => {
        if (!r.ok) throw new Error(`${caminho}: HTTP ${r.status}`);
        return r.json();
      })
      .then(transformar)
      .catch((e) => {
        cache.delete(caminho); // deixa tentar de novo
        throw e;
      });
    cache.set(caminho, p);
  }
  return cache.get(caminho) as Promise<T>;
}

export const carregarResumo = () => buscar<Resumo>("resumo.json");

export const carregarUf = (uf: string) =>
  buscar<DadosUf>(`uf/${uf}.json`, (bruto) => {
    const b = bruto as { cidades: Tabela; votos: Tabela };
    return { cidades: deTabela<Linha>(b.cidades), votos: deTabela<VotoNaCidade>(b.votos) };
  });

export const carregarMapa = (nome: string) => buscar<Mapa>(`mapa/${nome}.json`);

type Estado<T> = { dado: T | null; erro: string | null };

/** Carrega e acompanha um recurso. `chave` null = não carregar ainda. */
export function useRecurso<T>(chave: string | null, carregar: (chave: string) => Promise<T>): Estado<T> {
  const [estado, setEstado] = useState<Estado<T>>({ dado: null, erro: null });
  useEffect(() => {
    if (chave === null) return;
    let vivo = true;
    setEstado({ dado: null, erro: null });
    carregar(chave)
      .then((dado) => vivo && setEstado({ dado, erro: null }))
      .catch((e: Error) => vivo && setEstado({ dado: null, erro: e.message }));
    return () => {
      vivo = false;
    };
  }, [chave, carregar]);
  return estado;
}

/* ---------- leitura segura de uma linha ---------- */

export const n = (l: Linha | undefined, campo: string): number => {
  const v = l?.[campo];
  return typeof v === "number" ? v : NaN;
};

export const t = (l: Linha | undefined, campo: string): string => {
  const v = l?.[campo];
  return v === undefined || v === null ? "" : String(v);
};
