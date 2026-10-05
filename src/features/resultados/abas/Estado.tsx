"use client";
import React, { useMemo, useState } from "react";
import { carregarMapa, carregarUf, n, t, useRecurso, type Linha, type Resumo } from "../dados";
import { num, pct, titulo } from "../formato";
import { BarrasGrupos, BarrasQuociente, MapaCoropletico, Ranking } from "../graficos";
import { Carregando, Chips, Filtros, Kpis, Legenda, Secao, SeletorUf, Tabela, type Coluna } from "../pecas";
import { GRUPOS, INDICADORES, PORTES, linhasGrupos, pctDe } from "../apoio";
import { COLUNAS_CANDIDATO } from "./Candidatos";

export const COLUNAS_CIDADE: Coluna[] = [
  { chave: "municipio_nome", rotulo: "Município", tipo: "txt" },
  { chave: "porte", rotulo: "Porte", tipo: "txt" },
  { chave: "eleitorado", rotulo: "Eleitorado" },
  { chave: "pct_comparecimento", rotulo: "Comparec.", tipo: "pct" },
  { chave: "missao_pres", rotulo: "Renan" },
  { chave: "pct_missao_pres", rotulo: "Renan %", tipo: "pct", valor: (l) => pctDe(l, "pct_missao_pres") },
  { chave: "missao_df", rotulo: "Missão DF" },
  { chave: "pct_missao_df", rotulo: "DF %", tipo: "pct", valor: (l) => pctDe(l, "pct_missao_df") },
  { chave: "missao_de", rotulo: "Missão DE" },
  { chave: "pct_missao_de", rotulo: "DE %", tipo: "pct", valor: (l) => pctDe(l, "pct_missao_de") },
  { chave: "missao_leg_df", rotulo: "Legenda DF" },
  { chave: "aproveitamento_df", rotulo: "Aproveit. Renan→DF", tipo: "barra", max: 1 },
  { chave: "indice_forca_df", rotulo: "Força DF", tipo: "dec", ajuda: "% do Missão na cidade ÷ % no estado (1,00 = média)" },
  { chave: "pct_direita_df", rotulo: "Direita DF %", tipo: "pct", valor: (l) => pctDe(l, "pct_direita_df") },
  { chave: "pct_esquerda_df", rotulo: "Esquerda DF %", tipo: "pct", valor: (l) => pctDe(l, "pct_esquerda_df") },
  { chave: "vagas_ver", rotulo: "Vagas vereador" },
  { chave: "qe_ver_2028_est", rotulo: "QE vereador 2028" },
  { chave: "situacao_vereador", rotulo: "Vereador", tipo: "txt" },
];

export default function Estado({ resumo, uf, setUf }: { resumo: Resumo; uf: string; setUf: (u: string) => void }) {
  const opcoes = resumo.ufs.map((u) => String(u.uf)).filter((u) => u !== "zz");
  const linha = resumo.ufs.find((u) => u.uf === uf) as Linha;
  const dados = useRecurso(uf, carregarUf);
  const mapa = useRecurso(uf, carregarMapa);
  const [indicador, setIndicador] = useState("Missão Dep. Federal");
  const [porte, setPorte] = useState("Todos");
  const [ordem, setOrdem] = useState<"Total" | "%">("Total");
  const ind = INDICADORES[indicador];
  const cidades = useMemo(() => dados.dado?.cidades ?? [], [dados.dado]);
  const cargoDe = (c: string) => (uf === "df" && c === "Deputado Estadual" ? "Deputado Distrital" : c);

  const valores: Record<string, number> = {};
  const rotulos: Record<string, string> = {};
  for (const c of cidades) {
    const cod = t(c, "codigo_ibge");
    valores[cod] = pctDe(c, ind.pct);
    rotulos[cod] = `${titulo(t(c, "municipio_nome"))}: ${pct(valores[cod], 2)} · ${num(n(c, ind.total))} ${ind.unidade} · ${num(n(c, "eleitorado"))} eleitores`;
  }
  const top = [...cidades]
    .sort((a, b) => (ordem === "Total" ? n(b, ind.total) - n(a, ind.total) : pctDe(b, ind.pct) - pctDe(a, ind.pct)))
    .slice(0, 20);

  return (
    <>
      <Filtros>
        <SeletorUf uf={uf} opcoes={opcoes} aoMudar={setUf} />
      </Filtros>

      <Secao titulo="Participação do eleitorado" sub={`${num(cidades.length)} municípios. Brancos e nulos na eleição para Deputado Federal.`}>
        <Kpis
          itens={[
            { rotulo: "Eleitorado", valor: num(n(linha, "eleitorado")) },
            { rotulo: "Compareceram", valor: num(n(linha, "comparecimento")), sub: pct(n(linha, "pct_comparecimento")) },
            { rotulo: "Não votaram", valor: num(n(linha, "abstencao")), sub: pct(n(linha, "pct_abstencao")) },
            { rotulo: "Brancos", valor: num(n(linha, "brancos_df")), sub: pct(n(linha, "pct_brancos_df")) },
            { rotulo: "Nulos", valor: num(n(linha, "nulos_df")), sub: pct(n(linha, "pct_nulos_df")) },
          ]}
        />
      </Secao>

      <Secao titulo="Cadeiras e quociente eleitoral" sub="QE = votos válidos ÷ vagas. O partido precisa de 80% do QE para disputar as sobras; o candidato, de 10% do QE em votos nominais para ser eleito.">
        {(["df", "de"] as const).map((c) =>
          n(linha, `qe_${c}`) > 0 ? (
            <div key={c} style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 700, margin: "10px 0 0" }}>{c === "df" ? "Deputado Federal" : cargoDe("Deputado Estadual")}</p>
              <Kpis
                itens={[
                  { rotulo: "Vagas", valor: num(n(linha, `vagas_${c}`)) },
                  { rotulo: "Votos por cadeira (QE)", valor: num(n(linha, `qe_${c}`)) },
                  { rotulo: "Eleitores por cadeira", valor: num(n(linha, `eleitores_por_cadeira_${c}`)) },
                  { rotulo: "Missão", valor: num(n(linha, `missao_${c}`)), sub: `legenda ${num(n(linha, `missao_leg_${c}`))} (${pct(n(linha, `pct_leg_missao_${c}`))})`, missao: true },
                  { rotulo: "Quocientes atingidos", valor: num(n(linha, `qe_atingidos_${c}`), 2), sub: `${num(n(linha, `eleitos_${c}`) || 0)} eleito(s)`, missao: true },
                  { rotulo: "Faltaram p/ próxima cadeira", valor: num(n(linha, `faltam_proximo_qe_${c}`)), sub: "aprox., sem cálculo de sobras", missao: true },
                  { rotulo: "Mínimo por candidato", valor: num(n(linha, `minimo_individual_${c}`)), sub: "10% do QE", missao: true },
                ]}
              />
            </div>
          ) : null,
        )}
        <BarrasQuociente
          textoRenan="votos do Renan no estado"
          linhas={(["df", "de"] as const)
            .filter((c) => n(linha, `qe_${c}`) > 0)
            .map((c) => ({
              nome: c === "df" ? "Dep. Federal" : cargoDe("Deputado Estadual").replace("Deputado", "Dep."),
              qe: n(linha, `qe_${c}`),
              nominal: n(linha, `missao_nom_${c}`) || 0,
              legenda: n(linha, `missao_leg_${c}`) || 0,
              renan: n(linha, "missao_pres"),
            }))}
        />
      </Secao>

      <Secao titulo="Renan → Missão" sub="Quanto do voto do Renan para Presidente virou voto do Missão para deputado.">
        <Kpis
          itens={[
            { rotulo: "Renan Santos", valor: num(n(linha, "missao_pres")), sub: `${pct(n(linha, "pct_missao_pres"), 2)} dos válidos`, missao: true },
            { rotulo: "Aproveitamento DF", valor: pct(n(linha, "aproveitamento_df")), sub: `${num(n(linha, "renan_nao_convertido_df"))} não convertidos`, missao: true },
            { rotulo: "Aproveitamento DE", valor: pct(n(linha, "aproveitamento_de")), sub: `${num(n(linha, "renan_nao_convertido_de"))} não convertidos`, missao: true },
            { rotulo: "Renan em cadeiras de DF", valor: num(n(linha, "renan_em_qe_df"), 2), sub: "se 100% virassem voto no partido", missao: true },
          ]}
        />
      </Secao>

      <Secao titulo="Como os votos válidos se dividiram">
        <Legenda itens={GRUPOS.slice(0, 4).map(([, nome, cor]) => [cor, nome])} />
        <BarrasGrupos linhas={linhasGrupos(linha, cargoDe)} />
      </Secao>

      <Secao titulo="Cidades">
        <Chips valor={indicador} opcoes={Object.keys(INDICADORES)} aoMudar={setIndicador} />
        {dados.dado ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
            <MapaCoropletico mapa={mapa.dado} valores={valores} rotulos={rotulos} />
            <div>
              <Chips valor={ordem} opcoes={["Total", "%"] as ("Total" | "%")[]} aoMudar={setOrdem} nome={(o) => `Top 20 por ${o === "Total" ? "total" : "%"}`} />
              <Ranking
                itens={top.map((c) => ({
                  nome: titulo(t(c, "municipio_nome")),
                  valor: ordem === "Total" ? n(c, ind.total) : pctDe(c, ind.pct),
                  texto: `${pct(pctDe(c, ind.pct), 2)} · ${num(n(c, ind.total))}`,
                }))}
              />
            </div>
          </div>
        ) : (
          <Carregando erro={dados.erro} />
        )}
      </Secao>

      <Secao titulo="Tabela de cidades">
        <Chips valor={porte} opcoes={["Todos", ...PORTES]} aoMudar={setPorte} />
        <Tabela linhas={porte === "Todos" ? cidades : cidades.filter((c) => c.porte === porte)} colunas={COLUNAS_CIDADE} ordem="eleitorado" />
      </Secao>

      <Secao titulo="Candidatos do Missão no estado">
        <Tabela linhas={resumo.candidatos.filter((c) => c.uf === uf)} colunas={COLUNAS_CANDIDATO} ordem="votos" />
      </Secao>
    </>
  );
}
