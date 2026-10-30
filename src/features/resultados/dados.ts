"use client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { carregarContagemExplorar, carregarContagemResumo, carregarContagemUf, type Fidelidade } from "@/features/resultados/segundoTurnoDados";

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
  /** perfil do voto de cada partido somado no país (Dep. Federal e Estadual) */
  partidosBrasil?: Linha[];
  /** o número fácil (1414…) contra o melhor dos outros do Missão, por UF e cargo */
  efeitoNumero?: Linha[];
  /** candidatos do movimento antes do partido existir (2022, 2024): trajetória, herança e futuro */
  movimento?: Movimento[];
  /** 2º turno: peso do ajuste da fidelidade e a régua dos outros eliminados (junto em `carregarResumo`) */
  fidelidade?: Fidelidade;
};

export type Movimento = {
  nome: string;
  papel: string;
  uf: string;
  base: string;
  sq_2026?: string;
  ano_antes: number;
  cargo_antes: string;
  trajetoria: Linha[];
  herancaBairros: Linha;
  herancaCidades: Linha | null;
  extra: Linha;
  futuro: Linha;
  bairros: Linha[];
  /** quanto dos votos de antes dele os candidatos do Missão de 2026 pegaram, na cidade-base */
  captura: Linha[];
  capturaMeta: Linha;
};

/** `posicao`: lugar do candidato entre todos os do cargo na cidade; `total_cand`: quantos tiveram voto. */
export type VotoNaCidade = { candidato_sq: string; municipio_codigo: string; votos: number; posicao?: number; total_cand?: number };
/**
 * Candidato do Missão numa cidade: votos × o que o 14 da cidade explica para ele.
 * `puxado` = taxa típica dele (votos por voto do Renan) × votos do Renan ali; próprio = votos − puxado.
 */
export type ProprioNaCidade = {
  cand: string;
  municipio_codigo: string;
  votos: number;
  puxado: number;
  /** cidade com recorte por bairro: o bairro onde ele teve mais voto próprio (régua = a cidade) */
  melhor_bairro?: string;
  mb_votos?: number;
  mb_puxado?: number;
};
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

/* ---------- o 2º turno nas mesmas linhas ---------- */

/*
 * A contagem dos RDVs do 2º turno (`public/contagem-2026-2t/`) entra nas
 * linhas do 1º com prefixo `t2_`: Brasil e estados pela UF, cidades pelo
 * código TSE, bairros pela `bairro_chave` (o export já põe cada local de
 * votação no bairro dele no 1º turno). Sem o 2º turno, a página segue só
 * com o 1º.
 */
const CAMPOS_2T: [string, string][] = [
  ["t2_votos", "votos_1"],
  ["t2_nulos", "nulos_1"],
  ["t2_nulos14", "nulos14_1"],
  ["t2_base14", "votos14_1t"],
  ["t2_votos_gov", "votos_3"],
  ["t2_nulos14_gov", "nulos14_3"],
  ["t2_fiel_aj", "t2_fiel_aj"],
];
export const do2t = (c: Linha | undefined): Linha => {
  const o: Linha = {};
  if (c) for (const [k, de] of CAMPOS_2T) if (typeof c[de] === "number") o[k] = c[de];
  return o;
};
const semFalha = <T,>(p: Promise<T>) => p.catch(() => null);
const juntos = new Map<string, Promise<unknown>>();
function junto<T>(chave: string, fazer: () => Promise<T>): Promise<T> {
  if (!juntos.has(chave))
    juntos.set(
      chave,
      fazer().catch((e) => {
        juntos.delete(chave);
        throw e;
      }),
    );
  return juntos.get(chave) as Promise<T>;
}

export const carregarResumo = () =>
  junto("resumo", async () => {
    const [r, c] = await Promise.all([buscar<Resumo>("resumo.json"), semFalha(carregarContagemResumo())]);
    if (!c) return r;
    const porUf = new Map(c.ufs.map((u) => [String(u.uf), u]));
    return { ...r, fidelidade: c.fidelidade, brasil: { ...r.brasil, ...do2t(c.brasil) }, ufs: r.ufs.map((u) => ({ ...u, ...do2t(porUf.get(String(u.uf))) })) };
  });

export const carregarUf = (uf: string) =>
  junto(`uf/${uf}`, async () => {
    const [d, c] = await Promise.all([
      buscar<DadosUf>(`uf/${uf}.json`, (bruto) => {
        const b = bruto as { cidades: Tabela; votos: Tabela; proprio?: Tabela | null };
        return {
          cidades: deTabela<Linha>(b.cidades),
          votos: deTabela<VotoNaCidade>(b.votos),
          proprio: b.proprio ? deTabela<ProprioNaCidade>(b.proprio) : [],
        };
      }),
      semFalha(carregarContagemUf(uf)),
    ]);
    if (!c) return d;
    const porCodigo = new Map(c.map((x) => [String(x.municipio), x]));
    return { ...d, cidades: d.cidades.map((x) => ({ ...x, ...do2t(porCodigo.get(String(x.municipio_codigo))) })) };
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
export type VotoNoBairro = { b: number; cargo_key: string; p: number; votos: number; posicao?: number };
export type QuedaNoBairro = { b: number; p: number; votos: number; votos_22: number; perda: number };
/** Nome forte da direita no estado que vai mal num bairro mais à direita que o estado (calculado no export). */
export type FracoNoBairro = { b: number; p: number; votos: number; forca: number };
/** Candidato do Missão num bairro: votos × o puxado pelo 14 do bairro (régua = a cidade). */
export type ProprioNoBairro = { b: number; p: number; votos: number; puxado: number };
export type DadosBairros = {
  bairros: Linha[];
  locais: Linha[];
  candidatos: VotoNoBairro[];
  quedas: QuedaNoBairro[];
  fracos: FracoNoBairro[];
  proprio: ProprioNoBairro[];
  /** perfil do voto dos partidos no bairro (os 8 maiores e o Missão, por cargo) */
  partidos: Linha[];
  pessoas: Linha[];
  /** votos do 2º turno em locais sem par no 1º turno: ficam fora dos bairros */
  t2VotosFora?: number;
};
/** Bairros oficiais e distritos (`areas`, pela chave do bairro) sobre o fundo da sede; locais em x/y no mesmo desenho. */
export type MapaBairros = { largura: number; altura: number; fundo: Record<string, string>; areas: Record<string, string> };

const lista = <T,>(t: Tabela | null | undefined): T[] => (t ? deTabela<T>(t) : []);

/** `chave` = `<uf>/<município>` */
export const carregarBairros = (chave: string) =>
  junto(`bairros/${chave}`, async () => {
    const [d, c] = await Promise.all([lerBairros(chave), semFalha(carregarContagemExplorar(chave))]);
    if (!c) return d;
    const porChave = new Map(c.bairros.map((b) => [String(b.bairro_chave), b]));
    return { ...d, t2VotosFora: c.t2_votos_fora ?? 0, bairros: d.bairros.map((b) => ({ ...b, ...porChave.get(String(b.bairro_chave)) })) };
  });

const lerBairros = (chave: string) =>
  buscar<DadosBairros>(`bairros/${chave}.json`, (bruto) => {
    const b = bruto as Record<string, Tabela | null>;
    return {
      bairros: lista<Linha>(b.bairros),
      locais: lista<Linha>(b.locais),
      candidatos: lista<VotoNoBairro>(b.candidatos),
      quedas: lista<QuedaNoBairro>(b.quedas),
      fracos: lista<FracoNoBairro>(b.fracos),
      proprio: lista<ProprioNoBairro>(b.proprio),
      partidos: lista<Linha>(b.partidos),
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
  const [estado, setEstado] = useState<Estado<T> & { chave: string | null }>({ chave: null, dado: null, erro: null });
  useEffect(() => {
    if (chave === null) return;
    let vivo = true;
    setEstado({ chave, dado: null, erro: null });
    carregar(chave)
      .then((dado) => vivo && setEstado({ chave, dado, erro: null }))
      .catch((e: Error) => vivo && setEstado({ chave, dado: null, erro: e.message }));
    return () => {
      vivo = false;
    };
  }, [chave, carregar]);
  // A renderização já recebe a chave nova antes de o efeito rodar. Não mostra
  // os números do município anterior sob o nome do município recém-escolhido.
  return chave !== null && estado.chave === chave ? estado : { dado: null, erro: null };
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

/* ---------- perfil do voto dos partidos ---------- */

/** O estado (com eleitos, puxador e federação) e cada cidade; `grupos`: sigla → grupo. */
export type DadosPartidos = { estado: Linha[]; cidades: Linha[]; grupos: Record<string, string> };

export const carregarPartidos = (uf: string) =>
  buscar<DadosPartidos>(`partidos/${uf}.json`, (bruto) => {
    const b = bruto as { estado: Tabela; cidades: Tabela; grupos: Record<string, string> };
    return { estado: deTabela<Linha>(b.estado), cidades: deTabela<Linha>(b.cidades), grupos: b.grupos ?? {} };
  });
