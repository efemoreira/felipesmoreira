"use client";
import { BlocoCadeiras, BlocoLegenda, BlocoRenan } from "../blocos";
import React, { useMemo, useState } from "react";
import { carregarMapa, n, useRecurso, type Resumo } from "../dados";
import { compacto, num, pct, UF_IBGE, UF_NOMES } from "../formato";
import { BarrasGrupos, MapaCoropletico, Ranking } from "../graficos";
import { Chips, Kpis, Legenda, Secao, Tabela } from "../pecas";
import { GRUPOS, INDICADORES, linhasGrupos, pctDe } from "../apoio";

export default function Brasil({ resumo }: { resumo: Resumo }) {
  const br = resumo.brasil;
  const [indicador, setIndicador] = useState("Renan");
  const mapa = useRecurso("br", carregarMapa);
  const ufs = useMemo(() => resumo.ufs.filter((u) => u.uf !== "zz"), [resumo.ufs]);
  const ind = INDICADORES[indicador];

  const valores: Record<string, number> = {};
  const rotulos: Record<string, string> = {};
  for (const u of ufs) {
    const cod = UF_IBGE[String(u.uf)];
    valores[cod] = pctDe(u, ind.pct);
    rotulos[cod] = `${UF_NOMES[String(u.uf)]}: ${pct(valores[cod], 2)} · ${num(n(u, ind.total))} ${ind.unidade}`;
  }

  return (
    <>
      <Secao explica="participacao" titulo="Participação do eleitorado" sub="Inclui o exterior. Brancos e nulos da eleição para Presidente.">
        <Kpis
          itens={[
            { rotulo: "Eleitorado", valor: compacto(n(br, "eleitorado")) },
            { rotulo: "Compareceram", valor: compacto(n(br, "comparecimento")), sub: pct(n(br, "pct_comparecimento")) },
            { rotulo: "Não votaram", valor: compacto(n(br, "abstencao")), sub: pct(n(br, "pct_abstencao")) },
            { rotulo: "Brancos", valor: compacto(n(br, "brancos_pres")), sub: `${pct(n(br, "pct_brancos_pres"))} dos que votaram` },
            { rotulo: "Nulos", valor: compacto(n(br, "nulos_pres")), sub: `${pct(n(br, "pct_nulos_pres"))} dos que votaram` },
          ]}
        />
      </Secao>

      <Secao explica="missao-total" titulo="Missão no Brasil">
        <Kpis
          itens={[
            { rotulo: "Renan Santos", valor: compacto(n(br, "missao_pres")), sub: `${pct(n(br, "pct_missao_pres"), 2)} dos válidos`, missao: true },
            { rotulo: "Deputado Federal", valor: compacto(n(br, "missao_df")), sub: `${pct(n(br, "pct_missao_df"), 2)} · legenda ${compacto(n(br, "missao_leg_df"))}`, missao: true },
            { rotulo: "Deputado Estadual", valor: compacto(n(br, "missao_de")), sub: `${pct(n(br, "pct_missao_de"), 2)} · legenda ${compacto(n(br, "missao_leg_de"))}`, missao: true },
            { rotulo: "Dep. federais eleitos", valor: num(n(br, "eleitos_df") || 0), sub: "lista oficial do TSE", missao: true },
            { rotulo: "Aproveitamento Renan → DF", valor: pct(n(br, "aproveitamento_df")), sub: "votos DF ÷ votos do Renan", missao: true },
          ]}
        />
      </Secao>

      <BlocoRenan linha={br} onde="Brasil" />
      <BlocoLegenda linha={br} onde="Brasil" />
      <BlocoCadeiras linha={br} onde="Brasil" nivel="brasil" />

      <Secao explica="divisao-validos" titulo="Como os votos válidos se dividiram" sub="Nominal + legenda. O Missão aparece separado da direita.">
        <Legenda itens={GRUPOS.slice(0, 4).map(([, nome, cor]) => [cor, nome])} />
        <BarrasGrupos linhas={linhasGrupos(br)} />
      </Secao>

      <Secao explica="mapa-estados" titulo="Por estado">
        <Chips valor={indicador} opcoes={Object.keys(INDICADORES)} aoMudar={setIndicador} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
          <MapaCoropletico mapa={mapa.dado} valores={valores} rotulos={rotulos} />
          <Ranking
            itens={[...ufs]
              .sort((a, b) => pctDe(b, ind.pct) - pctDe(a, ind.pct))
              .map((u) => ({ nome: UF_NOMES[String(u.uf)], valor: pctDe(u, ind.pct), texto: `${pct(pctDe(u, ind.pct), 2)} · ${num(n(u, ind.total))}` }))}
          />
        </div>
      </Secao>

      <Secao titulo="Tabela dos estados">
        <Tabela
          linhas={resumo.ufs.map((u) => ({ ...u, estado: UF_NOMES[String(u.uf)] }))}
          ordem="eleitorado"
          colunas={[
            { chave: "estado", rotulo: "Estado", tipo: "txt" },
            { chave: "eleitorado", rotulo: "Eleitorado" },
            { chave: "pct_comparecimento", rotulo: "Comparec.", tipo: "pct" },
            { chave: "missao_pres", rotulo: "Renan" },
            { chave: "pct_missao_pres", rotulo: "Renan %", tipo: "pct" },
            { chave: "missao_df", rotulo: "Missão DF" },
            { chave: "pct_missao_df", rotulo: "DF %", tipo: "pct" },
            { chave: "missao_de", rotulo: "Missão DE" },
            { chave: "pct_missao_de", rotulo: "DE %", tipo: "pct" },
            { chave: "aproveitamento_df", rotulo: "Aproveit. DF", tipo: "barra", max: 1 },
            { chave: "vagas_df", rotulo: "Vagas DF" },
            { chave: "qe_df", rotulo: "QE DF" },
            { chave: "qe_atingidos_df", rotulo: "QE atingidos DF", tipo: "dec" },
            { chave: "eleitos_df", rotulo: "Eleitos DF" },
          ]}
        />
        <p style={{ fontSize: 13, opacity: 0.75 }}>QE = quociente eleitoral, os votos que custam uma cadeira.</p>
      </Secao>
    </>
  );
}
