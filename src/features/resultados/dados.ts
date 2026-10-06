"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";

/**
 * Os dados de /resultados: JSON estático em `public/resultados-2026/`, gerado
 * pelo projeto de análise (`python -m src.cli export-site`). Nada passa pelo
 * painel PHP — é resultado público do TSE, já processado.
 *
 * - `resumo.json` chega uma vez (UFs, Brasil, candidatos, fontes…);
 * - `uf/<uf>.json` (cidades) e `mapa/<nome>.json` só quando o estado é aberto,
 *   e ficam guardados na memória da aba: trocar de aba não baixa de novo;
 * - `bairros/<uf>/<município>.json` e `mapa-bairros/…` só quando a cidade é
 *   aberta na aba Bairros; `adversarios/<uf>.json` na aba Adversários.
 *   O município é o código do TSE (o mesmo de `uf/<uf>.json`).
 */

const BASE = "/resultados-2026";

/** Linha de painel: os nomes de coluna seguem o padrão `<grupo>_<cargo>` do projeto de análise. */
export type Linha = Record<string, number | string | boolean | undefined>;

/** Uma base usada, com a data em que o TSE/IBGE publicou o arquivo baixado. */
export type Fonte = { nome: string; url: string; publicado: string; baixado?: string };

export type Resumo = {
  geradoEm: string;
  fonte: string;
  fontes?: Fonte[];
  /** UFs que têm o recorte por bairro gerado */
  bairrosUfs?: string[];
  /** quais cidades têm bairro: todas nas UFs completas; nas outras, só a partir de `minEleitores` */
  bairrosCorte?: { ufsCompletas: string[]; minEleitores: number };
  brasil: Linha;
  ufs: Linha[];
  legendaPartidos: Linha[];
  numeros: Linha[];
  porte: Linha[];
  candidatos: Linha[];
};

export type VotoNaCidade = { candidato_sq: string; municipio_codigo: string; votos: number };
/** Candidato do Missão numa cidade: votos × o que a força do partido ali explicaria (a mais = votos − esperado). */
export type ProprioNaCidade = { cand: string; municipio_codigo: string; votos: number; esperado: number };
export type DadosUf = { cidades: Linha[]; votos: VotoNaCidade[]; proprio: ProprioNaCidade[] };
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
    const b = bruto as { cidades: Tabela; votos: Tabela; proprio?: Tabela | null };
    return {
      cidades: deTabela<Linha>(b.cidades),
      votos: deTabela<VotoNaCidade>(b.votos),
      proprio: b.proprio ? deTabela<ProprioNaCidade>(b.proprio) : [],
    };
  });

export const carregarMapa = (nome: string) => buscar<Mapa>(`mapa/${nome}.json`);

/* ---------- bairros ---------- */

/** A cidade tem `bairros/<uf>/<município>.json`? A mesma regra do export (`tem_bairros`). */
export function temBairros(resumo: Resumo, uf: string, cidade: Linha | undefined): boolean {
  if (!cidade || !resumo.bairrosUfs?.includes(uf)) return false;
  const corte = resumo.bairrosCorte;
  if (!corte) return true;
  return corte.ufsCompletas.includes(uf) || n(cidade, "eleitorado") >= corte.minEleitores;
}

/** Candidato num bairro: `b` = índice em `bairros`, `p` = índice em `pessoas`. */
export type VotoNoBairro = { b: number; cargo_key: string; p: number; votos: number };
export type QuedaNoBairro = { b: number; p: number; votos: number; votos_22: number; perda: number };
/** Nome forte da direita no estado que vai mal num bairro mais à direita que o estado (calculado no export). */
export type FracoNoBairro = { b: number; p: number; votos: number; forca: number };
/** Candidato do Missão num bairro × o esperado pela força do partido ali (régua = a cidade). */
export type ProprioNoBairro = { b: number; p: number; votos: number; esperado: number };
export type DadosBairros = {
  bairros: Linha[];
  locais: Linha[];
  candidatos: VotoNoBairro[];
  quedas: QuedaNoBairro[];
  fracos: FracoNoBairro[];
  proprio: ProprioNoBairro[];
  pessoas: Linha[];
};
/** Bairros oficiais e distritos (`areas`, pela chave do bairro) sobre o fundo da sede; locais em x/y no mesmo desenho. */
export type MapaBairros = { largura: number; altura: number; fundo: Record<string, string>; areas: Record<string, string> };

const lista = <T,>(t: Tabela | null | undefined): T[] => (t ? deTabela<T>(t) : []);

/** `chave` = `<uf>/<município>` */
export const carregarBairros = (chave: string) =>
  buscar<DadosBairros>(`bairros/${chave}.json`, (bruto) => {
    const b = bruto as Record<string, Tabela | null>;
    return {
      bairros: lista<Linha>(b.bairros),
      locais: lista<Linha>(b.locais),
      candidatos: lista<VotoNoBairro>(b.candidatos),
      quedas: lista<QuedaNoBairro>(b.quedas),
      fracos: lista<FracoNoBairro>(b.fracos),
      proprio: lista<ProprioNoBairro>(b.proprio),
      pessoas: lista<Linha>(b.pessoas),
    };
  });

export const carregarMapaBairros = (chave: string) => buscar<MapaBairros>(`mapa-bairros/${chave}.json`);

/* ---------- adversários ---------- */

export type DadosAdversarios = {
  pessoas: Linha[];
  quedasCidade: Linha[];
  /** as 6 cidades com mais voto de cada pessoa (2026 e 2022) */
  cidadesPessoa: Linha[];
  /** pautas (Câmara): temas e projetos de quem foi deputado federal em 2023-2026 */
  temas: Linha[];
  projetos: Linha[];
  partidos: Linha[];
  cidades: Linha[];
};

export const carregarAdversarios = (uf: string) =>
  buscar<DadosAdversarios>(`adversarios/${uf}.json`, (bruto) => {
    const b = bruto as Record<string, Tabela | null>;
    return {
      pessoas: lista<Linha>(b.pessoas),
      quedasCidade: lista<Linha>(b.quedasCidade),
      cidadesPessoa: lista<Linha>(b.cidadesPessoa),
      temas: lista<Linha>(b.temas),
      projetos: lista<Linha>(b.projetos),
      partidos: lista<Linha>(b.partidos),
      cidades: lista<Linha>(b.cidades),
    };
  });

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

/* ---------- onde temos gente (painel) ---------- */

/**
 * Totais da base de pessoas por cidade e bairro (`/painel/api/gente.php`). Só
 * abre para quem está logado no painel com a área Pessoas — a página é
 * estática, então pergunta e mostra o estado: sem sessão, sem permissão ou os totais.
 */
export type GenteBairro = { bairro: string; total: number; porTipo: Record<string, number> };
export type GenteCidade = { cidade: string; total: number; porTipo: Record<string, number>; bairros: GenteBairro[] };
export type Gente = { autenticado: boolean; permitido: boolean; tipos?: Record<string, string>; cidades?: GenteCidade[] };

export const carregarGente = () => apiFetch<Gente>("/gente.php");

/** "Vicente Pinzón" e "VICENTE PINZON" são o mesmo lugar. */
export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase().replace(/[^A-Z0-9]+/g, " ").replace(/^BAIRRO /, "").trim();
