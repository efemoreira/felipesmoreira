"use client";
import React, { useEffect, useMemo, useState } from "react";
import { C } from "@/lib/theme";
import { carregarBairros, carregarMapaBairros, carregarUf, n, t, useRecurso, type DadosBairros, type Linha, type MapaBairros as DadosMapa, type Resumo } from "../dados";
import { compacto, num, pct, titulo } from "../formato";
import { BarrasGrupos, MapaBairros, type PontoLocal } from "../graficos";
import { Busca, Carregando, Chips, Escolha, Filtros, Kpis, Legenda, Nota, Secao, SeletorUf, Tabela } from "../pecas";
import { GRUPOS, NOME_CARGO, NOME_ORIGEM, ladoTexto, linhasTempo, linkMapa, pontos } from "../apoio";
import { Roteiro } from "../Roteiro";
import { BlocoLegenda, BlocoRenan, BlocoVereadorLocal } from "../blocos";

/**
 * Bairros: a cidade por dentro. O voto de cada seção somado por local de
 * votação, e o local no bairro onde fica (IBGE, distrito ou cartório). Os três
 * anos (2022, 2024, 2026) vêm somados pelo mesmo bairro.
 */

type Indicador = { rotulo: string; valor: (l: Linha) => number; divergente?: boolean; formato: (x: number) => string };

const INDICADORES: Record<string, Indicador> = {
  lado: { rotulo: "Pende para (comparado ao estado)", valor: (l) => n(l, "lado_rel_pres"), divergente: true, formato: pontos },
  andou: { rotulo: "Andou para a direita desde 2022", valor: (l) => n(l, "var_lado_pres"), divergente: true, formato: pontos },
  renan: { rotulo: "Renan (% dos válidos)", valor: (l) => n(l, "missao_pres") / n(l, "validos_pres"), formato: (x) => pct(x, 1) },
  df: { rotulo: "Missão Dep. Federal (% dos válidos)", valor: (l) => n(l, "missao_df") / n(l, "validos_df"), formato: (x) => pct(x, 2) },
  oportunidade: { rotulo: "Oportunidade por eleitor", valor: (l) => n(l, "oportunidade") / n(l, "eleitorado"), formato: (x) => pct(x, 0) },
  comparecimento: { rotulo: "Comparecimento", valor: (l) => n(l, "comparecimento") / n(l, "eleitorado"), formato: (x) => pct(x, 0) },
};

export default function Bairros({
  resumo,
  uf,
  setUf,
  rota,
  setRota,
}: {
  resumo: Resumo;
  uf: string;
  setUf: (u: string) => void;
  /** [município, chave do bairro] — vêm do endereço (#bairros/ce/13897/ALDEOTA) */
  rota: string[];
  setRota: (r: string[]) => void;
}) {
  const disponiveis = resumo.bairrosUfs ?? [];
  const ufOk = disponiveis.includes(uf) ? uf : disponiveis[0] ?? uf;
  const dadosUf = useRecurso(ufOk, carregarUf);
  const cidades = useMemo(() => dadosUf.dado?.cidades ?? [], [dadosUf.dado]);
  const [busca, setBusca] = useState("");
  const [indicador, setIndicador] = useState<keyof typeof INDICADORES>("lado");
  const [codigo, chaveBairro] = rota;

  const filtradas = useMemo(() => {
    const b = busca.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
    return b ? cidades.filter((c) => t(c, "municipio_nome").normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(b)) : cidades;
  }, [busca, cidades]);

  /* sem cidade no endereço (ou cidade de outro estado): cai na maior da lista */
  useEffect(() => {
    if (filtradas.length && !filtradas.some((c) => c.municipio_codigo === codigo)) setRota([String(filtradas[0].municipio_codigo)]);
  }, [filtradas, codigo, setRota]);

  const cidade = cidades.find((c) => c.municipio_codigo === codigo);
  const chave = cidade ? `${ufOk}/${codigo}` : null;
  const dados = useRecurso(chave, carregarBairros);
  const mapa = useRecurso(chave, carregarMapaBairros);
  const nomes = Object.fromEntries(filtradas.map((c) => [String(c.municipio_codigo), titulo(t(c, "municipio_nome"))]));

  if (!disponiveis.length) {
    return <Nota>O recorte por bairro ainda não foi gerado. Rode `python -m src.cli bairros` e `export-site` no projeto de análise.</Nota>;
  }

  return (
    <>
      <Filtros>
        <SeletorUf
          uf={ufOk}
          opcoes={disponiveis}
          aoMudar={(u) => {
            setUf(u);
            setBusca("");
            setRota([]);
          }}
        />
        <Busca rotulo="Buscar cidade" valor={busca} aoMudar={setBusca} dica="ex.: Fortaleza" />
        {filtradas.length > 0 && (
          <Escolha rotulo="Município" valor={codigo ?? ""} opcoes={Object.keys(nomes)} aoMudar={(c) => setRota([c])} nome={(c) => nomes[c] ?? c} />
        )}
      </Filtros>

      {!cidade || !dados.dado ? (
        <Carregando erro={dadosUf.erro ?? dados.erro} />
      ) : (
        <Cidade
          uf={ufOk}
          cidade={cidade}
          dados={dados.dado}
          mapa={mapa.dado}
          indicador={indicador}
          setIndicador={setIndicador}
          chaveBairro={chaveBairro}
          escolher={(b) => setRota(b ? [String(codigo), b] : [String(codigo)])}
        />
      )}
    </>
  );
}

function Cidade({
  uf,
  cidade,
  dados,
  mapa,
  indicador,
  setIndicador,
  chaveBairro,
  escolher,
}: {
  uf: string;
  cidade: Linha;
  dados: DadosBairros;
  mapa: DadosMapa | null;
  indicador: keyof typeof INDICADORES;
  setIndicador: (i: keyof typeof INDICADORES) => void;
  chaveBairro?: string;
  escolher: (b: string | null) => void;
}) {
  const nomeCidade = titulo(t(cidade, "municipio_nome"));
  const { bairros, locais } = dados;
  const ind = INDICADORES[indicador];
  const porChave = useMemo(() => new Map(bairros.map((b) => [t(b, "bairro_chave"), b])), [bairros]);
  const bairro = chaveBairro ? porChave.get(chaveBairro) : undefined;
  const nomeBairro = (l: Linha) => t(bairros[n(l, "b")], "bairro") || "—";

  const valores = useMemo(() => Object.fromEntries(bairros.map((b) => [t(b, "bairro_chave"), ind.valor(b)])), [bairros, ind]);
  const rotulos = useMemo(
    () =>
      Object.fromEntries(
        bairros.map((b) => [
          t(b, "bairro_chave"),
          `${t(b, "bairro")}: ${ind.rotulo.toLowerCase()} ${ind.formato(ind.valor(b))} · ${num(n(b, "eleitorado"))} eleitores · ${ladoTexto(n(b, "lado_pres"))}`,
        ]),
      ),
    [bairros, ind],
  );
  const pontosMapa: PontoLocal[] = useMemo(
    () =>
      locais
        .filter((l) => Number.isFinite(n(l, "x")))
        .map((l) => ({
          id: `${t(l, "zona")}-${t(l, "local")}`,
          x: n(l, "x"),
          y: n(l, "y"),
          eleitores: n(l, "eleitorado"),
          area: t(bairros[n(l, "b")], "bairro_chave"),
          texto: `${t(l, "nome")} (${nomeBairro(l)}): ${num(n(l, "eleitorado"))} eleitores · Renan ${pct(n(l, "missao_pres") / n(l, "validos_pres"))}`,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [locais, bairros],
  );

  const total = (c: string) => bairros.reduce((s, b) => s + (n(b, c) || 0), 0);
  const eleitores = total("eleitorado");
  const deIbge = bairros.filter((b) => String(b.bairro_origem).startsWith("ibge")).reduce((s, b) => s + (n(b, "eleitorado") || 0), 0);
  const maisDireita = [...bairros].filter((b) => n(b, "eleitorado") >= 1000).sort((a, b) => n(b, "lado_pres") - n(a, "lado_pres"))[0];
  const maiorOport = [...bairros].sort((a, b) => n(b, "oportunidade") - n(a, "oportunidade"))[0];

  const linhasTabela = useMemo(
    () =>
      bairros.map((b) => ({
        ...b,
        origem: NOME_ORIGEM[t(b, "bairro_origem")] ?? t(b, "bairro_origem"),
        pct_comp: n(b, "comparecimento") / n(b, "eleitorado"),
        lado_txt: ladoTexto(n(b, "lado_pres")),
        pct_renan: n(b, "missao_pres") / n(b, "validos_pres"),
        pct_mdf: n(b, "missao_df") / n(b, "validos_df"),
        pct_dir_de: n(b, "direita_de") / n(b, "validos_de"),
      })) as Linha[],
    [bairros],
  );

  return (
    <>
      <Secao titulo={`${nomeCidade} por bairro`} sub={`${num(bairros.length)} bairros e distritos · ${num(locais.length)} locais de votação`} explica="bairro-origem">
        <Kpis
          itens={[
            { rotulo: "Eleitores", valor: num(eleitores), sub: `${pct(deIbge / eleitores)} em bairro oficial do IBGE` },
            { rotulo: "Pende para (cidade)", valor: ladoTexto(cidadeLado(bairros)), sub: `${pontos(cidadeLado(bairros))} · 2022: ${pontos(cidadeLado(bairros, "_22"))}` },
            maisDireita && { rotulo: "Mais à direita", valor: t(maisDireita, "bairro"), sub: `${pontos(n(maisDireita, "lado_rel_pres"))} em relação ao estado` },
            maiorOport && { rotulo: "Maior oportunidade", valor: t(maiorOport, "bairro"), sub: `${num(n(maiorOport, "oportunidade"))} votos`, missao: true },
            { rotulo: "Renan na cidade", valor: num(total("missao_pres")), sub: pct(total("missao_pres") / total("validos_pres"), 2), missao: true },
          ].filter(Boolean) as { rotulo: string; valor: string; sub?: string; missao?: boolean }[]}
        />
      </Secao>

      <Secao titulo="Mapa" explica="bairros-mapa">
        <Chips valor={indicador} opcoes={Object.keys(INDICADORES) as (keyof typeof INDICADORES)[]} aoMudar={setIndicador} nome={(k) => INDICADORES[k].rotulo} />
        <MapaBairros
          mapa={mapa}
          valores={valores}
          rotulos={rotulos}
          pontos={pontosMapa}
          ativo={chaveBairro ?? null}
          aoEscolher={(b) => escolher(b)}
          divergente={ind.divergente}
          formato={ind.formato}
        />
      </Secao>

      <Secao titulo="Bairros" sub="Toque no título da coluna para ordenar. Escolha um bairro na lista abaixo para abrir o detalhe." explica="bairros-tabela">
        <Tabela
          linhas={linhasTabela}
          ordem="eleitorado"
          arquivo={`bairros-${nomeCidade.toLowerCase().replace(/\s+/g, "-")}`}
          colunas={[
            { chave: "bairro", rotulo: "Bairro", tipo: "txt" },
            { chave: "eleitorado", rotulo: "Eleitores" },
            { chave: "pct_comp", rotulo: "Compareceu", tipo: "pct" },
            { chave: "lado_txt", rotulo: "Pende para", tipo: "txt", valor: (l) => `${t(l, "lado_txt")} (${pontos(n(l, "lado_pres"))})` },
            { chave: "lado_rel_pres", rotulo: "vs. estado", valor: (l) => n(l, "lado_rel_pres") * 100, tipo: "dec", ajuda: "pontos acima (+) ou abaixo (−) do estado" },
            { chave: "var_lado_pres", rotulo: "Andou 22→26", valor: (l) => n(l, "var_lado_pres") * 100, tipo: "dec", ajuda: "pontos para a direita (+) desde 2022" },
            { chave: "pct_renan", rotulo: "Renan", tipo: "pct" },
            { chave: "pct_mdf", rotulo: "Missão DF", tipo: "pct" },
            { chave: "aproveitamento_df", rotulo: "Renan → DF", tipo: "pct" },
            { chave: "pct_dir_de", rotulo: "Direita DE", tipo: "pct" },
            { chave: "oportunidade", rotulo: "Oportunidade" },
            { chave: "missao_em_qe_ver", rotulo: "Missão em QE ver.", tipo: "dec", ajuda: "melhor votação de deputado do Missão no bairro ÷ QE de vereador estimado da cidade" },
            { chave: "origem", rotulo: "Nome vem de", tipo: "txt" },
          ]}
        />
      </Secao>

      <Secao titulo="Detalhe do bairro">
        <Escolha
          rotulo="Bairro"
          valor={chaveBairro ?? ""}
          opcoes={["", ...[...bairros].sort((a, b) => t(a, "bairro").localeCompare(t(b, "bairro"), "pt-BR")).map((b) => t(b, "bairro_chave"))]}
          aoMudar={(b) => escolher(b || null)}
          nome={(k) => (k ? t(porChave.get(k), "bairro") : "Escolha um bairro…")}
        />
        {bairro ? <Bairro uf={uf} bairro={bairro} dados={dados} /> : <p style={{ opacity: 0.75 }}>Escolha um bairro na lista ou toque nele no mapa.</p>}
      </Secao>

      <Secao titulo="Roteiro de rua" sub={bairro ? `Locais de ${t(bairro, "bairro")}.` : `Os locais de ${nomeCidade} com mais oportunidade.`} explica="roteiro">
        <Roteiro
          locais={bairro ? locais.filter((l) => n(l, "b") === bairros.indexOf(bairro)) : locais}
          nomeBairro={nomeBairro}
          titulo={`Roteiro de rua — ${bairro ? `${t(bairro, "bairro")}, ` : ""}${nomeCidade}/${uf.toUpperCase()}`}
        />
      </Secao>
    </>
  );
}

/** "Pende para" da cidade inteira, pela soma dos bairros (a mesma fórmula do export). */
function cidadeLado(bairros: Linha[], suf = ""): number {
  const s = (c: string) => bairros.reduce((a, b) => a + (n(b, c) || 0), 0);
  const v = s(`validos_pres${suf}`);
  return v ? (s(`missao_pres${suf}`) + s(`direita_pres${suf}`) - s(`esquerda_pres${suf}`)) / v : NaN;
}

function Bairro({ uf, bairro, dados }: { uf: string; bairro: Linha; dados: DadosBairros }) {
  const [cargo, setCargo] = useState("df");
  const idx = dados.bairros.indexOf(bairro);
  const locaisDoBairro = dados.locais.filter((l) => n(l, "b") === idx);
  const cand = dados.candidatos
    .filter((c) => c.b === idx && c.cargo_key === cargo)
    .map((c) => {
      const p = dados.pessoas[c.p] ?? {};
      const pctB = c.votos / n(bairro, `validos_${cargo}`);
      return {
        nome: t(p, "nome"),
        numero: t(p, "numero"),
        partido: t(p, "partido_sigla"),
        grupo: t(p, "grupo_atual"),
        votos: c.votos,
        pct: pctB,
        forca: pctB / n(p, "pct_uf"),
        situacao: t(p, "situacao"),
        status: t(p, "status"),
      } as Linha;
    });
  const quedas = dados.quedas
    .filter((q) => q.b === idx)
    .map((q) => {
      const p = dados.pessoas[q.p] ?? {};
      return { nome: t(p, "nome"), partido: t(p, "partido_sigla"), grupo: t(p, "grupo_atual"), cargo: NOME_CARGO[t(p, "cargo_key")] ?? "", votos_22: q.votos_22, votos: q.votos, perda: q.perda } as Linha;
    });
  const cargos = ["df", "de", "gov", "sen", "pres"].filter((c) => dados.candidatos.some((x) => x.b === idx && x.cargo_key === c));

  return (
    <div style={{ marginTop: 14 }}>
      <Kpis
        itens={[
          { rotulo: "Eleitores", valor: num(n(bairro, "eleitorado")), sub: `${num(n(bairro, "locais"))} locais · distrito ${t(bairro, "distrito") || "—"}` },
          { rotulo: "Compareceu", valor: pct(n(bairro, "comparecimento") / n(bairro, "eleitorado")), sub: `${num(n(bairro, "eleitorado") - n(bairro, "comparecimento"))} não votaram` },
          { rotulo: "Pende para", valor: ladoTexto(n(bairro, "lado_pres")), sub: `${pontos(n(bairro, "lado_pres"))} · 2022: ${pontos(n(bairro, "lado_pres_22"))} · ${ladoTexto(n(bairro, "lado_rel_pres"), true).toLowerCase()}` },
          { rotulo: "Renan", valor: num(n(bairro, "missao_pres")), sub: pct(n(bairro, "missao_pres") / n(bairro, "validos_pres"), 2), missao: true },
          { rotulo: "Missão Dep. Federal", valor: num(n(bairro, "missao_df")), sub: `aproveitamento ${pct(n(bairro, "aproveitamento_df"))} · força ${num(n(bairro, "indice_forca_df"), 2)}`, missao: true },
          { rotulo: "Oportunidade", valor: num(n(bairro, "oportunidade")), sub: `${pct(n(bairro, "oportunidade") / n(bairro, "eleitorado"), 0)} do eleitorado`, missao: true },
          {
            rotulo: "Vereador 2028",
            valor: `${num(n(bairro, "missao_em_qe_ver"), 2)} QE`,
            sub: `o Renan daqui = ${num(n(bairro, "renan_em_qe_ver"), 2)} QE de vereador`,
            missao: true,
          },
        ]}
      />

      <BlocoRenan linha={bairro} onde={t(bairro, "bairro")} distrital={uf === "df"} />
      <BlocoLegenda linha={bairro} onde={t(bairro, "bairro")} distrital={uf === "df"} />
      <BlocoVereadorLocal linha={bairro} onde={t(bairro, "bairro")} />

      <Secao titulo="Como o bairro votou: 2022, 2024 e 2026" explica="bairro-tempo">
        <Legenda itens={GRUPOS.slice(0, 4).map(([, nome, cor]) => [cor, nome])} />
        <BarrasGrupos linhas={linhasTempo(bairro)} />
      </Secao>

      <Secao titulo="Candidatos no bairro" sub="Os mais votados de cada cargo. Força acima de 1 = mais forte aqui do que no estado." explica="bairro-candidatos">
        <Chips valor={cargo} opcoes={cargos} aoMudar={setCargo} nome={(c) => NOME_CARGO[c] ?? c} />
        <Tabela
          linhas={cand}
          ordem="votos"
          colunas={[
            { chave: "nome", rotulo: "Candidato", tipo: "txt" },
            { chave: "numero", rotulo: "Nº", tipo: "txt" },
            { chave: "partido", rotulo: "Partido", tipo: "txt" },
            { chave: "grupo", rotulo: "Grupo", tipo: "txt" },
            { chave: "votos", rotulo: "Votos" },
            { chave: "pct", rotulo: "% no bairro", tipo: "pct" },
            { chave: "forca", rotulo: "Força", tipo: "dec", ajuda: "% no bairro ÷ % no estado" },
            { chave: "situacao", rotulo: "Situação", tipo: "txt" },
            { chave: "status", rotulo: "22 → 26", tipo: "txt" },
          ]}
        />
      </Secao>

      {quedas.length > 0 && (
        <Secao titulo="Quem perdeu voto aqui desde 2022" sub="Mesmo cargo em 2022 e 2026. O voto que eles perderam no bairro está solto." explica="em-queda">
          <Tabela
            linhas={quedas}
            ordem="perda"
            colunas={[
              { chave: "nome", rotulo: "Candidato", tipo: "txt" },
              { chave: "partido", rotulo: "Partido 2026", tipo: "txt" },
              { chave: "grupo", rotulo: "Grupo", tipo: "txt" },
              { chave: "cargo", rotulo: "Cargo", tipo: "txt" },
              { chave: "votos_22", rotulo: "Votos 2022" },
              { chave: "votos", rotulo: "Votos 2026" },
              { chave: "perda", rotulo: "Perdeu" },
            ]}
          />
        </Secao>
      )}

      <Secao titulo="Locais de votação do bairro" explica="locais">
        <div style={{ display: "grid", gap: 10 }}>
          {locaisDoBairro.map((l) => (
            <div key={`${t(l, "zona")}-${t(l, "local")}`} style={{ background: C.cream, border: `1px solid rgba(24,18,3,.25)`, padding: "10px 12px", fontSize: 14, lineHeight: 1.45 }}>
              <b>{t(l, "nome")}</b> · zona {t(l, "zona")}
              <br />
              {t(l, "endereco")}
              {t(l, "bairro_tse") && <span style={{ opacity: 0.75 }}> · o cartório chama o bairro de “{titulo(t(l, "bairro_tse"))}”</span>}
              <br />
              {num(n(l, "eleitorado"))} eleitores · {num(n(l, "secoes"))} seções · Renan {pct(n(l, "missao_pres") / n(l, "validos_pres"))} · Missão DF{" "}
              {num(n(l, "missao_df"))} · {ladoTexto(n(l, "lado_pres")).toLowerCase()} · oportunidade {compacto(n(l, "oportunidade"))}
              {linkMapa(l) && (
                <>
                  {" · "}
                  <a href={linkMapa(l)} target="_blank" rel="noopener noreferrer" style={{ color: C.ink, display: "inline-block", padding: "10px 0", minHeight: 44 }}>
                    abrir no mapa
                  </a>
                </>
              )}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 13, opacity: 0.75, margin: "8px 0 0" }}>{uf.toUpperCase()} · endereço do cadastro do TSE de 2026.</p>
      </Secao>
    </div>
  );
}
