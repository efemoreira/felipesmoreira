"use client";
import React, { useEffect, useMemo, useState } from "react";
import { carregarUf, n, t, useRecurso, type Linha, type Resumo } from "../dados";
import { num, pct, titulo } from "../formato";
import { BarrasGrupos, BarrasQuociente } from "../graficos";
import { Busca, Carregando, Escolha, Filtros, Kpis, Legenda, Secao, SeletorUf, Tabela } from "../pecas";
import { GRUPOS, linhasGrupos, pctDe } from "../apoio";

export default function Municipio({ resumo, uf, setUf }: { resumo: Resumo; uf: string; setUf: (u: string) => void }) {
  const opcoes = resumo.ufs.map((u) => String(u.uf)).filter((u) => u !== "zz");
  const estado = resumo.ufs.find((u) => u.uf === uf) as Linha;
  const dados = useRecurso(uf, carregarUf);
  const cidades = useMemo(() => dados.dado?.cidades ?? [], [dados.dado]);
  const [busca, setBusca] = useState("");
  const [codigo, setCodigo] = useState("");

  const filtradas = useMemo(() => {
    const b = busca.trim().normalize("NFD").replace(/\p{Diacritic}/gu, "").toUpperCase();
    return b ? cidades.filter((c) => t(c, "municipio_nome").normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(b)) : cidades;
  }, [busca, cidades]);

  /* troca de estado ou de busca: cai na maior cidade da lista */
  useEffect(() => {
    if (filtradas.length && !filtradas.some((c) => c.municipio_codigo === codigo)) setCodigo(String(filtradas[0].municipio_codigo));
  }, [filtradas, codigo]);

  const cidade = cidades.find((c) => c.municipio_codigo === codigo);
  const nomes = Object.fromEntries(filtradas.map((c) => [String(c.municipio_codigo), titulo(t(c, "municipio_nome"))]));
  const cargoDe = (c: string) => (uf === "df" && c === "Deputado Estadual" ? "Deputado Distrital" : c);

  const candidatosNaCidade = useMemo(() => {
    if (!dados.dado || !cidade) return [];
    const porSq = new Map(resumo.candidatos.filter((c) => c.uf === uf).map((c) => [String(c.candidato_sq), c]));
    return dados.dado.votos
      .filter((v) => v.municipio_codigo === codigo)
      .map((v) => {
        const c = porSq.get(v.candidato_sq);
        const cargo = t(c, "cargo_key");
        return {
          cargo_nome: t(c, "cargo_nome"),
          candidato_numero: t(c, "candidato_numero"),
          candidato_urna: t(c, "candidato_urna"),
          votos: v.votos,
          pct: v.votos / n(cidade, `validos_${cargo}`),
          por_mil: (v.votos * 1000) / n(cidade, "eleitorado"),
          renan: v.votos / n(cidade, "missao_pres"),
        } as Linha;
      });
  }, [dados.dado, cidade, codigo, resumo.candidatos, uf]);

  const vs = (c: string) => (
    <>
      {pct(pctDe(cidade as Linha, `pct_missao_${c}`), 2)} na cidade
      {c !== "pres" && <> · legenda {num(n(cidade, `missao_leg_${c}`))}</>}
      <br />
      {uf.toUpperCase()}: {num(n(estado, `missao_${c}`))} ({pct(n(estado, `pct_missao_${c}`), 2)})
    </>
  );

  return (
    <>
      <Filtros>
        <SeletorUf uf={uf} opcoes={opcoes} aoMudar={(u) => { setUf(u); setBusca(""); }} />
        <Busca rotulo="Buscar cidade" valor={busca} aoMudar={setBusca} dica="ex.: Fortaleza" />
        {filtradas.length > 0 && <Escolha rotulo="Município" valor={codigo} opcoes={Object.keys(nomes)} aoMudar={setCodigo} nome={(c) => nomes[c]} />}
      </Filtros>

      {!cidade ? (
        <Carregando erro={dados.erro} />
      ) : (
        <>
          <Secao
            titulo={`${titulo(t(cidade, "municipio_nome"))} — ${uf.toUpperCase()}`}
            sub={`Porte: ${t(cidade, "porte")} · ${pct(n(cidade, "eleitorado") / n(estado, "eleitorado"))} do eleitorado do estado`}
          >
            <Kpis
              itens={[
                { rotulo: "Eleitorado", valor: num(n(cidade, "eleitorado")) },
                { rotulo: "Compareceram", valor: num(n(cidade, "comparecimento")), sub: `${pct(n(cidade, "pct_comparecimento"))} (estado ${pct(n(estado, "pct_comparecimento"))})` },
                { rotulo: "Não votaram", valor: num(n(cidade, "abstencao")), sub: pct(n(cidade, "pct_abstencao")) },
                { rotulo: "Brancos (Presidente)", valor: num(n(cidade, "brancos_pres")), sub: pct(n(cidade, "pct_brancos_pres")) },
                { rotulo: "Nulos (Presidente)", valor: num(n(cidade, "nulos_pres")), sub: pct(n(cidade, "pct_nulos_pres")) },
              ]}
            />
          </Secao>

          <Secao titulo={`Missão em ${titulo(t(cidade, "municipio_nome"))}`} sub="Números da cidade; embaixo de cada um, o total do estado para comparar.">
            <Kpis
              itens={[
                { rotulo: "Renan na cidade", valor: num(n(cidade, "missao_pres")), sub: vs("pres"), missao: true },
                { rotulo: "Dep. Federal na cidade", valor: num(n(cidade, "missao_df")), sub: vs("df"), missao: true },
                { rotulo: "Dep. Estadual na cidade", valor: num(n(cidade, "missao_de")), sub: vs("de"), missao: true },
                { rotulo: "Aproveitamento Renan → DF", valor: pct(n(cidade, "aproveitamento_df")), sub: `${num(n(cidade, "renan_nao_convertido_df"))} não convertidos`, missao: true },
                { rotulo: "Índice de força (DF)", valor: num(n(cidade, "indice_forca_df"), 2), sub: "1,00 = média do estado", missao: true },
              ]}
            />
          </Secao>

          {n(cidade, "qe_ver_2028_est") > 0 && (
            <Secao titulo="Vereador" sub="Vagas e quociente da eleição de 2024; o QE de 2028 é estimado pela variação do comparecimento até 2026.">
              <Kpis
                itens={[
                  { rotulo: "Cadeiras de vereador", valor: num(n(cidade, "vagas_ver")) },
                  { rotulo: "Votos por cadeira 2024", valor: num(n(cidade, "qe_ver_2024")) },
                  { rotulo: "QE estimado 2028", valor: num(n(cidade, "qe_ver_2028_est")) },
                  { rotulo: "Eleitores por vereador", valor: num(n(cidade, "eleitores_por_vereador")) },
                  {
                    rotulo: "Votos do Renan fariam vereador?",
                    valor: `${t(cidade, "renan_faz_vereador")}${n(cidade, "renan_vereadores") >= 1 ? ` · ${num(n(cidade, "renan_vereadores"))} cadeira(s)` : ""}`,
                    sub: `${num(n(cidade, "missao_pres"))} votos = ${num(n(cidade, "renan_em_qe_ver"), 2)} QE`,
                    missao: true,
                  },
                  { rotulo: "Situação do Missão", valor: t(cidade, "situacao_vereador"), sub: `melhor votação de deputado: ${num(n(cidade, "missao_melhor_prop"))}`, missao: true },
                ]}
              />
              <p style={{ fontSize: 14, margin: "12px 0 6px" }}>Se fosse eleição de vereador, com os votos de 2026 na cidade:</p>
              <BarrasQuociente
                textoRenan="votos do Renan como se fossem para vereador"
                linhas={[
                  { nome: "Votos p/ Dep. Federal", qe: n(cidade, "qe_ver_2028_est"), nominal: n(cidade, "missao_nom_df") || 0, legenda: n(cidade, "missao_leg_df") || 0, renan: n(cidade, "missao_pres") },
                  { nome: "Votos p/ Dep. Estadual", qe: n(cidade, "qe_ver_2028_est"), nominal: n(cidade, "missao_nom_de") || 0, legenda: n(cidade, "missao_leg_de") || 0 },
                ]}
              />
            </Secao>
          )}

          <Secao titulo="Como os votos válidos se dividiram">
            <Legenda itens={GRUPOS.slice(0, 4).map(([, nome, cor]) => [cor, nome])} />
            <BarrasGrupos linhas={linhasGrupos(cidade, cargoDe)} />
          </Secao>

          <Secao titulo="Candidatos do Missão na cidade">
            <Tabela
              linhas={candidatosNaCidade}
              ordem="votos"
              colunas={[
                { chave: "candidato_urna", rotulo: "Candidato", tipo: "txt" },
                { chave: "candidato_numero", rotulo: "Número", tipo: "txt" },
                { chave: "cargo_nome", rotulo: "Cargo", tipo: "txt" },
                { chave: "votos", rotulo: "Votos" },
                { chave: "pct", rotulo: "% dos válidos", tipo: "pct" },
                { chave: "por_mil", rotulo: "Votos / mil eleitores", tipo: "dec" },
                { chave: "renan", rotulo: "Votos ÷ Renan", tipo: "barra", max: 1 },
              ]}
            />
          </Secao>
        </>
      )}
    </>
  );
}
