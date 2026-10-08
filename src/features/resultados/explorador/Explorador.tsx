"use client";
import React, { useMemo, useState } from "react";
import { FONT_DADOS, PAINEL_DADOS as P, fileteDados } from "@/lib/theme";
import {
  carregarBairros,
  carregarMapa,
  carregarMapaBairros,
  carregarUf,
  n,
  t,
  temBairros,
  useRecurso,
  type Linha,
  type Resumo,
} from "../dados";
import { compacto, num, pct, titulo, UF_IBGE, UF_NOMES } from "../formato";
import {
  Carregando,
  Chips,
  Nota,
  Tabela,
  campo,
  cartao,
  kicker,
  Explica,
  linkBotao,
  type Coluna,
} from "../pecas";
import type { IdExplicacao } from "../explicacoes";
import { NOME_ORIGEM, PORTES, ladoTexto } from "../apoio";
import { NOME_REGIAO, REGIOES, linhasRegioes, ufsDaRegiao } from "../regioes";
import {
  COLUNAS_BAIRRO,
  COLUNAS_CIDADE,
  COLUNAS_REGIAO,
  COLUNAS_UF,
  enxutas,
} from "./colunas";
import {
  DetalheBairro,
  DetalheCidade,
  DetalheEstado,
  DetalheGeral,
} from "./detalhes";
import {
  Ficha,
  caixaBusca,
  estiloBotaoTrilha,
  type ItemMaiores,
} from "./Ficha";
import {
  INDICADORES_MAPA,
  PERGUNTAS,
  indicadorPorId,
  valeEm,
  type TipoFilho,
} from "./indicadores";
import {
  MapaExplorador,
  type AreaMapa,
  type PontoMapa,
} from "./MapaExplorador";
import {
  caixaDosPaths,
  comFolga,
  nivelDe,
  normalizar,
  trilha,
  type Caixa,
  type Caminho,
  type Opcoes,
} from "./niveis";

/**
 * O Explorador: o mapa na frente, o lugar ao lado e o detalhe embaixo. Desce
 * Brasil → região → estado → cidade → bairro sem trocar de tela — as cinco
 * abas que faziam isso, cada uma do seu jeito, viraram esta.
 */

type Filho = {
  id: string;
  nome: string;
  linha: Linha;
  areas: string[];
  caminho?: Caminho;
  peso: number;
};

type Vista = {
  tipo: string;
  nome: string;
  sub?: string;
  linha: Linha | null;
  pai?: { nome: string; linha: Linha };
  tipoFilho: TipoFilho | null;
  rotuloFilhos: string;
  filhos: Filho[];
  /** id da área → path */
  paths: Record<string, string>;
  largura: number;
  altura: number;
  caixa?: Caixa | null;
  contexto: string[];
  pontos: PontoMapa[];
  ativo?: string | null;
  carregando: boolean;
  erro?: string | null;
  colunas: Coluna[];
  arquivo: string;
  nota?: string;
};

const semAcento = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase();

export default function Explorador({
  resumo,
  caminho,
  opcoes,
  ir,
  mudarOpcoes,
}: {
  resumo: Resumo;
  caminho: Caminho;
  opcoes: Opcoes;
  ir: (c: Caminho) => void;
  mudarOpcoes: (o: Opcoes) => void;
}) {
  const nivel = nivelDe(caminho);
  const uf = caminho.uf ?? null;
  const [porRegiao, setPorRegiao] = useState(false);
  const [porte, setPorte] = useState("Todos");
  const [todasColunas, setTodasColunas] = useState(false);
  const [busca, setBusca] = useState("");

  const mapaBr = useRecurso("br", carregarMapa);
  const dadosUf = useRecurso(uf, carregarUf);
  const mapaUf = useRecurso(uf, carregarMapa);
  const cidades = useMemo(
    () => (uf ? (dadosUf.dado?.cidades ?? []) : []),
    [uf, dadosUf.dado],
  );
  const cidade = caminho.cidade
    ? cidades.find((c) => String(c.municipio_codigo) === caminho.cidade)
    : undefined;
  const chaveB =
    uf && cidade && temBairros(resumo, uf, cidade)
      ? `${uf}/${caminho.cidade}`
      : null;
  const bairrosRec = useRecurso(chaveB, carregarBairros);
  const mapaBRec = useRecurso(chaveB, carregarMapaBairros);
  const dadosB = chaveB ? bairrosRec.dado : null;
  const mapaB = chaveB ? mapaBRec.dado : null;

  const regioes = useMemo(() => linhasRegioes(resumo.ufs), [resumo.ufs]);
  const linhaUf = uf ? resumo.ufs.find((u) => u.uf === uf) : undefined;
  const linhaRegiao = caminho.regiao
    ? regioes.find((r) => r.regiao === caminho.regiao)
    : undefined;

  const ind = indicadorPorId(opcoes.pintar);
  const como: "pct" | "votos" =
    opcoes.como === "votos" && ind.votos ? "votos" : "pct";

  /* ----- o que cada nível mostra ----- */
  const vista: Vista = useMemo(() => {
    const brPaths = mapaBr.dado?.paths ?? {};
    const base = {
      largura: mapaBr.dado?.largura ?? 1000,
      altura: mapaBr.dado?.altura ?? 1000,
      contexto: [] as string[],
      pontos: [] as PontoMapa[],
      carregando: !mapaBr.dado,
      erro: mapaBr.erro,
    };
    const filhoUf = (u: Linha): Filho => ({
      id: String(u.uf),
      nome: UF_NOMES[String(u.uf)] ?? String(u.uf).toUpperCase(),
      linha: { ...u, nome: UF_NOMES[String(u.uf)] },
      areas: UF_IBGE[String(u.uf)] ? [UF_IBGE[String(u.uf)]] : [],
      caminho: normalizar({ uf: String(u.uf) }),
      peso: n(u, "eleitorado"),
    });

    if (nivel === "brasil") {
      const ufs = resumo.ufs.map(filhoUf);
      const filhosRegiao: Filho[] = regioes.map((r) => ({
        id: String(r.regiao),
        nome: String(r.nome),
        linha: r,
        areas: (REGIOES.find(([k]) => k === r.regiao)?.[2] ?? [])
          .map((u) => UF_IBGE[u])
          .filter(Boolean),
        caminho: { regiao: r.regiao as Caminho["regiao"] },
        peso: n(r, "eleitorado"),
      }));
      return {
        ...base,
        tipo: "País",
        nome: "Brasil",
        sub: `${compacto(n(resumo.brasil, "eleitorado"))} eleitores · inclui o exterior`,
        linha: resumo.brasil,
        tipoFilho: porRegiao ? "regiao" : "uf",
        rotuloFilhos: porRegiao ? "Regiões" : "Estados",
        filhos: porRegiao ? filhosRegiao : ufs,
        paths: brPaths,
        colunas: porRegiao ? COLUNAS_REGIAO : COLUNAS_UF,
        arquivo: porRegiao ? "regioes" : "estados",
      };
    }

    if (nivel === "regiao" && linhaRegiao) {
      const estados = ufsDaRegiao(resumo.ufs, caminho.regiao!).map(filhoUf);
      const ids = new Set(estados.flatMap((e) => e.areas));
      const exterior = caminho.regiao === "exterior";
      return {
        ...base,
        tipo: "Região",
        nome: String(linhaRegiao.nome),
        sub: `${compacto(n(linhaRegiao, "eleitorado"))} eleitores${exterior ? "" : ` · ${estados.length} estados`}`,
        linha: linhaRegiao,
        pai: { nome: "Brasil", linha: resumo.brasil },
        tipoFilho: "uf",
        rotuloFilhos: "Estados",
        filhos: estados,
        paths: brPaths,
        caixa: ids.size
          ? comFolga(
              caixaDosPaths(
                [...ids].map((i) => brPaths[i]).filter(Boolean),
              ) ?? { x: 0, y: 0, largura: 1000, altura: 1000 },
            )
          : null,
        contexto: Object.entries(brPaths)
          .filter(([k]) => !ids.has(k))
          .map(([, d]) => d),
        colunas: COLUNAS_UF,
        arquivo: `estados-${caminho.regiao}`,
        nota: exterior
          ? "O voto do exterior não tem mapa: são as seções nas embaixadas e consulados."
          : undefined,
      };
    }

    const nomeRegiao = caminho.regiao ? NOME_REGIAO[caminho.regiao] : "";
    const filhosCidade = (): Filho[] =>
      cidades.map((c) => ({
        id: t(c, "codigo_ibge"),
        nome: titulo(t(c, "municipio_nome")),
        linha: { ...c, nome: titulo(t(c, "municipio_nome")) },
        areas: [t(c, "codigo_ibge")],
        caminho: {
          regiao: caminho.regiao,
          uf: uf!,
          cidade: String(c.municipio_codigo),
        },
        peso: n(c, "eleitorado"),
      }));
    const mapaEstado = {
      paths: mapaUf.dado?.paths ?? {},
      largura: mapaUf.dado?.largura ?? 1000,
      altura: mapaUf.dado?.altura ?? 1000,
    };

    if (nivel === "estado" && linhaUf) {
      return {
        ...base,
        ...mapaEstado,
        tipo: `Estado · ${nomeRegiao}`,
        nome: UF_NOMES[uf!],
        sub: `${compacto(n(linhaUf, "eleitorado"))} eleitores · ${num(cidades.length)} municípios`,
        linha: linhaUf,
        pai: linhaRegiao ? { nome: nomeRegiao, linha: linhaRegiao } : undefined,
        tipoFilho: "cidade",
        rotuloFilhos: "Cidades",
        filhos: filhosCidade(),
        carregando: !dadosUf.dado || !mapaUf.dado,
        erro: dadosUf.erro ?? mapaUf.erro,
        colunas: COLUNAS_CIDADE,
        arquivo: `cidades-${uf}`,
      };
    }

    if ((nivel === "cidade" || nivel === "bairro") && linhaUf) {
      if (!cidade)
        return {
          ...base,
          ...mapaEstado,
          tipo: "Cidade",
          nome: "…",
          linha: null,
          tipoFilho: null,
          rotuloFilhos: "",
          filhos: [],
          carregando: !dadosUf.dado,
          erro: dadosUf.erro,
          colunas: [],
          arquivo: "",
        };
      const nomeCidade = titulo(t(cidade, "municipio_nome"));
      const paiEstado = { nome: UF_NOMES[uf!], linha: linhaUf };
      /* cidade sem recorte por bairro: o mapa do estado, com ela marcada */
      if (!chaveB) {
        return {
          ...base,
          ...mapaEstado,
          tipo: `Cidade · ${UF_NOMES[uf!]}`,
          nome: nomeCidade,
          sub: `${compacto(n(cidade, "eleitorado"))} eleitores · ${t(cidade, "porte")}`,
          linha: cidade,
          pai: paiEstado,
          tipoFilho: "cidade",
          rotuloFilhos: `Cidades de ${UF_NOMES[uf!]}`,
          filhos: filhosCidade(),
          ativo: t(cidade, "codigo_ibge"),
          carregando: !mapaUf.dado,
          erro: mapaUf.erro,
          colunas: [],
          arquivo: "",
          nota:
            resumo.bairrosCorte &&
            !resumo.bairrosCorte.ufsCompletas.includes(uf!)
              ? `Esta cidade não tem recorte por bairro: neste estado ele cobre as cidades a partir de ${num(resumo.bairrosCorte.minEleitores)} eleitores. O mapa mostra as outras cidades do estado.`
              : "Esta cidade não tem recorte por bairro. O mapa mostra as outras cidades do estado.",
        };
      }
      const bairros = dadosB?.bairros ?? [];
      const filhos: Filho[] = bairros.map((b) => ({
        id: t(b, "bairro_chave"),
        nome: t(b, "bairro"),
        linha: {
          ...b,
          nome: t(b, "bairro"),
          origem: NOME_ORIGEM[t(b, "bairro_origem")] ?? t(b, "bairro_origem"),
          pct_comp: n(b, "comparecimento") / n(b, "eleitorado"),
          lado_txt: ladoTexto(n(b, "lado_pres")),
          pct_renan: n(b, "missao_pres") / n(b, "validos_pres"),
          pct_mdf: n(b, "missao_df") / n(b, "validos_df"),
          pct_dir_de: n(b, "direita_de") / n(b, "validos_de"),
        },
        areas: [t(b, "bairro_chave")],
        caminho: {
          regiao: caminho.regiao,
          uf: uf!,
          cidade: caminho.cidade,
          bairro: t(b, "bairro_chave"),
        },
        peso: n(b, "eleitorado"),
      }));
      const pontos: PontoMapa[] = (dadosB?.locais ?? [])
        .filter((l) => Number.isFinite(n(l, "x")))
        .map((l) => ({
          id: `${t(l, "zona")}-${t(l, "local")}`,
          x: n(l, "x"),
          y: n(l, "y"),
          eleitores: n(l, "eleitorado"),
          texto: t(l, "nome"),
          area: t(bairros[n(l, "b")], "bairro_chave"),
        }));
      const bairro = caminho.bairro
        ? bairros.find((b) => t(b, "bairro_chave") === caminho.bairro)
        : undefined;
      const comum = {
        ...base,
        paths: mapaB?.areas ?? {},
        largura: mapaB?.largura ?? 1000,
        altura: mapaB?.altura ?? 1000,
        contexto: Object.values(mapaB?.fundo ?? {}),
        pontos,
        tipoFilho: "bairro" as TipoFilho,
        filhos,
        carregando: !dadosB || !mapaB,
        erro: bairrosRec.erro ?? mapaBRec.erro,
        colunas: COLUNAS_BAIRRO,
        arquivo: `bairros-${nomeCidade.toLowerCase().replace(/\s+/g, "-")}`,
      };
      if (nivel === "bairro" && bairro) {
        return {
          ...comum,
          tipo: `Bairro · ${nomeCidade}`,
          nome: t(bairro, "bairro"),
          sub: `${num(n(bairro, "eleitorado"))} eleitores · ${num(n(bairro, "locais"))} locais de votação · ${ladoTexto(n(bairro, "lado_pres")).toLowerCase()}`,
          linha: bairro,
          pai: { nome: nomeCidade, linha: cidade },
          rotuloFilhos: `Bairros de ${nomeCidade}`,
          ativo: t(bairro, "bairro_chave"),
        };
      }
      return {
        ...comum,
        tipo: `Cidade · ${UF_NOMES[uf!]}`,
        nome: nomeCidade,
        sub: `${compacto(n(cidade, "eleitorado"))} eleitores · ${t(cidade, "porte")} · ${num(bairros.length)} bairros`,
        linha: cidade,
        pai: paiEstado,
        rotuloFilhos: "Bairros",
      };
    }

    return {
      ...base,
      tipo: "",
      nome: "…",
      linha: null,
      tipoFilho: null,
      rotuloFilhos: "",
      filhos: [],
      paths: {},
      colunas: [],
      arquivo: "",
      carregando: true,
    };
  }, [
    nivel,
    mapaBr,
    mapaUf,
    dadosUf,
    resumo,
    regioes,
    porRegiao,
    linhaRegiao,
    linhaUf,
    caminho,
    cidades,
    cidade,
    chaveB,
    dadosB,
    mapaB,
    bairrosRec.erro,
    mapaBRec.erro,
    uf,
  ]);

  /* ----- áreas do mapa ----- */
  const areas: AreaMapa[] = useMemo(() => {
    const out: AreaMapa[] = [];
    const valeAqui = valeEm(ind, vista.tipoFilho);
    for (const f of vista.filhos)
      for (const id of f.areas) {
        const d = vista.paths[id];
        if (!d) continue;
        const v = valeAqui ? (ind.pct?.(f.linha) ?? NaN) : NaN;
        const votos = ind.votos?.(f.linha);
        out.push({
          id: f.areas.length > 1 ? `${f.id}:${id}` : f.id,
          d,
          nome: f.nome,
          valor: v,
          votos,
          peso: f.areas.length > 1 ? (id === f.areas[0] ? f.peso : 0) : f.peso,
          entra: !!f.caminho,
          detalhe: [
            `${ind.rotulo}: ${ind.formato(v)}${votos !== undefined && Number.isFinite(votos) ? ` · ${num(votos)} votos` : ""}`,
            `Renan ${pct(n(f.linha, "missao_pres") / n(f.linha, "validos_pres"), 2)} · Missão DF ${pct(n(f.linha, "missao_df") / n(f.linha, "validos_df"), 2)}`,
            `${compacto(n(f.linha, "eleitorado"))} eleitores`,
          ],
        });
      }
    return out;
  }, [vista, ind]);
  const filhoDaArea = (idArea: string) =>
    vista.filhos.find((f) => f.id === idArea.split(":")[0]);

  const entrar = (idArea: string) => {
    const f = filhoDaArea(idArea);
    if (f?.caminho) {
      setBusca("");
      ir(f.caminho);
    }
  };

  /* ----- busca de lugar ----- */
  const achados = useMemo(() => {
    const b = semAcento(busca.trim());
    if (b.length < 2) return [];
    const lista: { nome: string; tipo: string; caminho: Caminho }[] = [];
    for (const [k, nome] of REGIOES.map(([k, nome]) => [k, nome] as const))
      if (semAcento(nome).includes(b))
        lista.push({ nome, tipo: "Região", caminho: { regiao: k } });
    for (const u of resumo.ufs) {
      const nome = UF_NOMES[String(u.uf)];
      if (
        nome &&
        (semAcento(nome).includes(b) || String(u.uf).toUpperCase() === b)
      )
        lista.push({
          nome,
          tipo: "Estado",
          caminho: normalizar({ uf: String(u.uf) }),
        });
    }
    for (const c of cidades)
      if (semAcento(t(c, "municipio_nome")).includes(b))
        lista.push({
          nome: titulo(t(c, "municipio_nome")),
          tipo: `Cidade · ${uf?.toUpperCase()}`,
          caminho: normalizar({ uf: uf!, cidade: String(c.municipio_codigo) }),
        });
    for (const x of dadosB?.bairros ?? [])
      if (semAcento(t(x, "bairro")).includes(b))
        lista.push({
          nome: t(x, "bairro"),
          tipo: "Bairro",
          caminho: normalizar({
            uf: uf!,
            cidade: caminho.cidade,
            bairro: t(x, "bairro_chave"),
          }),
        });
    return lista.slice(0, 8);
  }, [busca, resumo.ufs, cidades, dadosB, uf, caminho.cidade]);

  /* ----- nomes da trilha ----- */
  const nomeDe = (c: Caminho): string => {
    const nv = nivelDe(c);
    if (nv === "brasil") return "Brasil";
    if (nv === "regiao") return NOME_REGIAO[c.regiao!];
    if (nv === "estado") return UF_NOMES[c.uf!] ?? c.uf!.toUpperCase();
    if (nv === "cidade")
      return cidade ? titulo(t(cidade, "municipio_nome")) : "Cidade";
    return vista.nome;
  };

  const itensFicha: ItemMaiores[] = (
    valeEm(ind, vista.tipoFilho) ? vista.filhos : []
  ).map((f) => ({
    id: f.id,
    nome: f.nome,
    linha: f.linha,
    entra: !!f.caminho,
  }));

  /* ----- tabela de baixo ----- */
  const colunaInd: Coluna = {
    chave: `_ind_${ind.id}`,
    rotulo: ind.rotulo,
    tipo: ind.divergente ? "txt" : "pct",
    valor: (l) =>
      ind.divergente ? ind.formato(ind.pct?.(l) ?? NaN) : (ind.pct?.(l) ?? NaN),
  };
  const colunasTabela = todasColunas
    ? vista.colunas
    : [
        ...enxutas(vista.colunas).slice(0, 2),
        ...(valeEm(ind, vista.tipoFilho) ? [colunaInd] : []),
        ...enxutas(vista.colunas).slice(2),
      ];
  const linhasTabela = vista.filhos
    .map((f) => f.linha)
    .filter(
      (l) =>
        vista.tipoFilho !== "cidade" || porte === "Todos" || l.porte === porte,
    );
  const mostrarTabela = vista.colunas.length > 0 && vista.filhos.length > 0;

  const distrital = uf === "df";
  const semArea = vista.filhos.filter((f) => f.areas.length > 0 && !f.areas.some((id) => vista.paths[id])).length;
  /* "Sobre este dado" do mapa e da tabela: o texto muda com o que está dentro */
  const explicaMapa: IdExplicacao = vista.tipoFilho === "bairro" ? "bairros-mapa" : vista.tipoFilho === "regiao" || nivel === "regiao" ? "regioes" : "mapa-estados";
  const explicaTabela: IdExplicacao = vista.tipoFilho === "bairro" ? "bairros-tabela" : vista.tipoFilho === "cidade" ? "cidades" : vista.tipoFilho === "regiao" ? "regioes" : "mapa-estados";

  return (
    <div className="mx" style={{ fontFamily: FONT_DADOS, color: P.tinta }}>
      <style>{CSS}</style>

      {/* trilha + busca */}
      <div className="mx-topo">
        <nav
          aria-label="Onde você está"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 4,
            minWidth: 0,
          }}
        >
          {trilha(caminho).map((c, i, l) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <span aria-hidden="true" style={{ color: P.tintaSuave }}>
                  ›
                </span>
              )}
              {i === l.length - 1 ? (
                <span
                  aria-current="page"
                  style={{
                    fontWeight: 800,
                    fontSize: 14.5,
                    minHeight: 44,
                    display: "inline-flex",
                    alignItems: "center",
                  }}
                >
                  {nomeDe(c)}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => ir(c)}
                  style={estiloBotaoTrilha}
                >
                  {nomeDe(c)}
                </button>
              )}
            </React.Fragment>
          ))}
        </nav>
        <div style={{ position: "relative", flex: "1 1 240px", maxWidth: 380 }}>
          <label>
            <span className="mx-oculto">Buscar lugar</span>
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar estado, cidade ou bairro…"
              style={campo}
            />
          </label>
          {achados.length > 0 && (
            <ul style={{ ...caixaBusca, listStyle: "none" }}>
              {achados.map((a) => (
                <li key={`${a.tipo}-${a.nome}`}>
                  <button
                    type="button"
                    className="mx-item"
                    onClick={() => {
                      setBusca("");
                      ir(a.caminho);
                    }}
                    style={{
                      all: "unset",
                      boxSizing: "border-box",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 8,
                      width: "100%",
                      minHeight: 44,
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 15,
                    }}
                  >
                    <b>{a.nome}</b>
                    <span style={{ color: P.tintaSuave, fontSize: 13 }}>
                      {a.tipo}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {busca.trim().length >= 2 && !achados.length && (
            <p style={{ fontSize: 13, color: P.tintaSuave, margin: "4px 0 0" }}>
              Nada com esse nome {uf ? `em ${UF_NOMES[uf]}` : ""}. Cidades
              aparecem depois de abrir o estado.
            </p>
          )}
        </div>
      </div>

      {/* o que pintar */}
      <div className="mx-filtros">
        {PERGUNTAS.map(([p, nomeP]) => (
          <div key={p} className="mx-grupo">
            <p style={{ ...kicker, margin: 0 }}>{nomeP}</p>
            <Chips
              valor={ind.id}
              opcoes={INDICADORES_MAPA.filter((i) => i.pergunta === p).map(
                (i) => i.id,
              )}
              aoMudar={(id) => mudarOpcoes({ ...opcoes, pintar: id })}
              nome={(id) => indicadorPorId(id).rotulo}
              desligado={(id) => {
                const i = indicadorPorId(id);
                return valeEm(i, vista.tipoFilho)
                  ? false
                  : (i.motivo ?? "Não existe neste nível.");
              }}
            />
          </div>
        ))}
        <div className="mx-grupo">
          <p style={{ ...kicker, margin: 0 }}>Mostrar como</p>
          <Chips
            valor={como}
            opcoes={["pct", "votos"] as ("pct" | "votos")[]}
            aoMudar={(v) => mudarOpcoes({ ...opcoes, como: v })}
            nome={(v) => (v === "pct" ? "% (cor)" : "Votos (círculo)")}
            desligado={(v) =>
              v === "votos" && !ind.votos
                ? "Este indicador não é contagem de votos."
                : false
            }
          />
        </div>
        {nivel === "brasil" && (
          <div className="mx-grupo">
            <p style={{ ...kicker, margin: 0 }}>Ver por</p>
            <Chips
              valor={porRegiao ? "regiao" : "uf"}
              opcoes={["uf", "regiao"]}
              aoMudar={(v) => setPorRegiao(v === "regiao")}
              nome={(v) => (v === "uf" ? "Estado" : "Região")}
            />
          </div>
        )}
      </div>

      {/* mapa + ficha */}
      <div className="mx-corpo">
        <div>
          <div style={{ ...cartao, padding: 12, minWidth: 0 }}>
            {vista.nota && <Nota>{vista.nota}</Nota>}
            {vista.carregando && !vista.erro ? (
              <Carregando />
            ) : vista.erro ? (
              <Carregando erro={vista.erro} />
            ) : (
              <MapaExplorador
                largura={vista.largura}
                altura={vista.altura}
                caixa={vista.caixa}
                areas={areas}
                contexto={vista.contexto}
                pontos={vista.pontos}
                modo={como}
                divergente={ind.divergente}
                formato={ind.formato}
                ativo={vista.ativo}
                aoEntrar={entrar}
                rotuloEntrar="Abrir"
                vazio={valeEm(ind, vista.tipoFilho) ? undefined : ind.motivo}
              />
            )}
            {semArea > 0 && !vista.carregando && (
              <p style={{ fontSize: 13, color: P.tintaSuave, margin: "6px 0 0" }}>
                {semArea === 1 ? "1 lugar não tem" : `${num(semArea)} lugares não têm`} contorno no mapa
                {vista.tipoFilho === "bairro" ? " (nome dado pelo cartório, fora da malha de bairros do IBGE)" : " (município criado depois da malha do IBGE de 2022)"} — estão na lista ao lado e na tabela.
              </p>
            )}
            <Explica id={explicaMapa} />
          </div>
          {/* tabela dos lugares de dentro */}
          {mostrarTabela && (
            <details
              className="mx-gaveta"
              style={{ ...cartao, padding: "0 14px", margin: "12px 0 0" }}
            >
              <summary
                style={{
                  cursor: "pointer",
                  minHeight: 52,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                <span
                  className="mx-seta"
                  aria-hidden="true"
                  style={{ display: "inline-block", width: 14 }}
                >
                  ›
                </span>
                <span style={{ flex: 1 }}>
                  Tabela: {vista.rotuloFilhos.toLowerCase()} (
                  {num(vista.filhos.length)})
                  <span
                    style={{
                      display: "block",
                      fontSize: 13,
                      fontWeight: 400,
                      color: P.tintaSuave,
                    }}
                  >
                    Ordenar, comparar, baixar em CSV. Toque numa linha para
                    abrir.
                  </span>
                </span>
              </summary>
              <div style={{ paddingBottom: 14 }}>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  {vista.tipoFilho === "cidade" && (
                    <Chips
                      valor={porte}
                      opcoes={["Todos", ...PORTES]}
                      aoMudar={setPorte}
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setTodasColunas((v) => !v)}
                    style={linkBotao}
                  >
                    {todasColunas
                      ? "Menos colunas"
                      : `Mais colunas (${vista.colunas.length})`}
                  </button>
                </div>
                <Explica id={explicaTabela} />
                <Tabela
                  key={`${nivel}-${vista.tipoFilho}-${todasColunas}`}
                  linhas={linhasTabela}
                  colunas={colunasTabela}
                  ordem="eleitorado"
                  arquivo={vista.arquivo}
                  aoEscolher={(l) => {
                    const f = vista.filhos.find((x) => x.linha === l);
                    if (f?.caminho) ir(f.caminho);
                  }}
                />
                {vista.tipoFilho === "uf" && (
                  <p style={{ fontSize: 13, color: P.tintaSuave }}>
                    QE = quociente eleitoral, os votos que custam uma cadeira.
                  </p>
                )}
              </div>
            </details>
          )}
        </div>
        <aside className="mx-ficha" aria-label="O lugar escolhido">
          {vista.linha ? (
            <Ficha
              tipo={vista.tipo}
              nome={vista.nome}
              sub={vista.sub}
              linha={vista.linha}
              pai={vista.pai}
              indicador={ind}
              filhos={itensFicha}
              rotuloFilhos={vista.rotuloFilhos}
              aoEscolher={entrar}
              distrital={distrital}
            />
          ) : (
            <Carregando erro={dadosUf.erro} />
          )}
        </aside>
      </div>

      {/* o detalhe do lugar */}
      <div style={{ marginTop: 22 }}>
        <h2 style={{ fontSize: 19, fontWeight: 800, margin: "0 0 2px" }}>
          Tudo sobre {vista.nome}
        </h2>
        <p style={{ fontSize: 14, color: P.tintaSuave, margin: 0 }}>
          Cada pergunta abre os números que respondem a ela.
        </p>
        {vista.linha && (nivel === "brasil" || nivel === "regiao") && (
          <DetalheGeral
            linha={vista.linha}
            onde={vista.nome}
            exterior={caminho.regiao === "exterior"}
          />
        )}
        {vista.linha && nivel === "estado" && uf && (
          <DetalheEstado
            resumo={resumo}
            uf={uf}
            linha={vista.linha}
            onde={vista.nome}
          />
        )}
        {nivel === "cidade" && cidade && linhaUf && dadosUf.dado && (
          <DetalheCidade
            resumo={resumo}
            uf={uf!}
            estado={linhaUf}
            cidade={cidade}
            dadosUf={dadosUf.dado}
            bairros={chaveB ? (dadosB ?? null) : null}
          />
        )}
        {nivel === "bairro" && cidade && dadosB && vista.linha && (
          <DetalheBairro
            key={caminho.bairro}
            uf={uf!}
            nomeCidade={titulo(t(cidade, "municipio_nome"))}
            bairro={vista.linha}
            dados={dadosB}
          />
        )}
        {nivel === "bairro" && cidade && linhaUf && dadosUf.dado && (
          <details
            className="mx-gaveta"
            style={{ ...cartao, padding: "0 14px", margin: "10px 0 0" }}
          >
            <summary
              style={{
                cursor: "pointer",
                minHeight: 52,
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              <span
                className="mx-seta"
                aria-hidden="true"
                style={{ display: "inline-block", width: 14 }}
              >
                ›
              </span>
              E a cidade inteira?
            </summary>
            <div style={{ paddingBottom: 14 }}>
              <button
                type="button"
                style={linkBotao}
                onClick={() =>
                  ir({
                    regiao: caminho.regiao,
                    uf: caminho.uf,
                    cidade: caminho.cidade,
                  })
                }
              >
                Abrir {titulo(t(cidade, "municipio_nome"))}
              </button>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

const CSS = `
  .mx-topo { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px 16px; margin: 4px 0 6px; }
  .mx-filtros { display: flex; flex-wrap: wrap; gap: 0 22px; padding: 8px 0 4px; border-top: ${fileteDados()}; }
  .mx-grupo { min-width: 0; }
  .mx-corpo { display: grid; grid-template-columns: minmax(0, 1fr); gap: 14px; margin-top: 8px; }
  .mx-corpo > * { min-width: 0; }
  .mx-filtros > * { max-width: 100%; }
  .mx-oculto { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
  .mx-gaveta > summary { list-style: none; }
  .mx-gaveta > summary::-webkit-details-marker { display: none; }
  .mx-gaveta[open] > summary .mx-seta { transform: rotate(90deg); }
  .mx-seta { transition: transform .15s; }
  .mx-item:hover, .mx-item:focus-visible { background: ${P.fundo}; }
  .linha-escolhe:hover td { background: ${P.fundo} !important; }
  .mx button:focus-visible, .mx summary:focus-visible, .mx input:focus-visible { outline: ${P.tinta} solid 2px; outline-offset: 2px; }
  @media (max-width: 899px) {
    .mx-filtros { flex-wrap: nowrap; overflow-x: auto; gap: 0 16px; margin: 0 -16px; padding: 8px 16px 2px; scrollbar-width: thin; }
    .mx-filtros > * { flex: 0 0 auto; max-width: none; }
    .mx-filtros [role="radiogroup"] { flex-wrap: nowrap; }
  }
  @media (min-width: 900px) {
    .mx-corpo { grid-template-columns: minmax(0, 1fr) 370px; align-items: start; }
    .mx-ficha { position: sticky; top: 76px; max-height: calc(100vh - 92px); overflow: auto; }
  }
  @media (prefers-reduced-motion: reduce) { .mx-seta { transition: none; } }
`;
