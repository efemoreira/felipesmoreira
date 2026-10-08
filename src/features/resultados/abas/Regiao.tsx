"use client";
import { BlocoCadeiras, BlocoLegenda, BlocoRenan } from "../blocos";
import React, { useMemo, useState } from "react";
import { carregarMapa, n, useRecurso, type Resumo } from "../dados";
import { compacto, num, pct, UF_IBGE, UF_NOMES } from "../formato";
import { BarrasGrupos, MapaCoropletico, Ranking } from "../graficos";
import { Chips, Filtros, Kpis, Legenda, Secao, Tabela } from "../pecas";
import { GRUPOS, INDICADORES, linhasGrupos, pctDe } from "../apoio";
import { NOME_REGIAO, REGIOES, linhasRegioes, regiaoDe, ufsDaRegiao, type Regiao as CodigoRegiao } from "../regioes";
import { COLUNAS_UF } from "./Brasil";

/** Entre o Brasil e o estado: as cinco regiões (e o exterior), somadas dos estados. */
export default function Regiao({ resumo, uf, abrirUf }: { resumo: Resumo; uf: string; abrirUf: (u: string) => void }) {
  const [regiao, setRegiao] = useState<CodigoRegiao>(() => regiaoDe(uf));
  const [indicador, setIndicador] = useState("Renan");
  const mapa = useRecurso("br", carregarMapa);
  const regioes = useMemo(() => linhasRegioes(resumo.ufs), [resumo.ufs]);
  const linha = regioes.find((r) => r.regiao === regiao)!;
  const estados = useMemo(() => ufsDaRegiao(resumo.ufs, regiao), [resumo.ufs, regiao]);
  const ind = INDICADORES[indicador];
  const nome = NOME_REGIAO[regiao];
  const exterior = regiao === "ex";

  const valores: Record<string, number> = {};
  const rotulos: Record<string, string> = {};
  for (const u of estados) {
    const cod = UF_IBGE[String(u.uf)];
    if (!cod) continue;
    valores[cod] = pctDe(u, ind.pct);
    rotulos[cod] = `${UF_NOMES[String(u.uf)]}: ${pct(valores[cod], 2)} · ${num(n(u, ind.total))} ${ind.unidade}`;
  }
  const textoInd = (l: (typeof regioes)[number]) => `${pct(pctDe(l, ind.pct), 2)} · ${num(n(l, ind.total))}`;

  return (
    <>
      <Filtros>
        <Chips valor={regiao} opcoes={REGIOES.map(([k]) => k)} aoMudar={setRegiao} nome={(k) => NOME_REGIAO[k]} />
      </Filtros>

      <Secao explica="regioes" titulo="As regiões lado a lado" sub="Soma dos estados de cada região. O Distrito Federal está no Centro-Oeste.">
        <Chips valor={indicador} opcoes={Object.keys(INDICADORES)} aoMudar={setIndicador} />
        <Ranking
          itens={[...regioes]
            .sort((a, b) => pctDe(b, ind.pct) - pctDe(a, ind.pct))
            .map((r) => ({ nome: String(r.nome), valor: pctDe(r, ind.pct), texto: textoInd(r) }))}
        />
        <Tabela
          linhas={regioes}
          ordem="eleitorado"
          colunas={[
            { chave: "nome", rotulo: "Região", tipo: "txt" },
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
            { chave: "eleitos_df", rotulo: "Eleitos DF" },
          ]}
        />
      </Secao>

      <Secao explica="participacao" titulo={`Participação do eleitorado — ${nome}`} sub="Brancos e nulos da eleição para Presidente.">
        <Kpis
          itens={[
            { rotulo: "Eleitorado", valor: compacto(n(linha, "eleitorado")) },
            { rotulo: "Compareceram", valor: compacto(n(linha, "comparecimento")), sub: pct(n(linha, "pct_comparecimento")) },
            { rotulo: "Não votaram", valor: compacto(n(linha, "abstencao")), sub: pct(n(linha, "pct_abstencao")) },
            { rotulo: "Brancos", valor: compacto(n(linha, "brancos_pres")), sub: `${pct(n(linha, "pct_brancos_pres"))} dos que votaram` },
            { rotulo: "Nulos", valor: compacto(n(linha, "nulos_pres")), sub: `${pct(n(linha, "pct_nulos_pres"))} dos que votaram` },
          ]}
        />
      </Secao>

      <BlocoRenan linha={linha} onde={nome} />
      {!exterior && <BlocoLegenda linha={linha} onde={nome} />}
      {!exterior && <BlocoCadeiras linha={linha} onde={nome} nivel="brasil" />}

      <Secao explica="divisao-validos" titulo="Como os votos válidos se dividiram" sub="Nominal + legenda. O Missão aparece separado da direita.">
        <Legenda itens={GRUPOS.slice(0, 4).map(([, nomeG, cor]) => [cor, nomeG])} />
        <BarrasGrupos linhas={linhasGrupos(linha)} />
      </Secao>

      {!exterior && (
        <>
          <Secao explica="mapa-estados" titulo={`Estados do ${nome}`}>
            <Chips valor={indicador} opcoes={Object.keys(INDICADORES)} aoMudar={setIndicador} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
              <MapaCoropletico mapa={mapa.dado} valores={valores} rotulos={rotulos} />
              <Ranking
                itens={[...estados]
                  .sort((a, b) => pctDe(b, ind.pct) - pctDe(a, ind.pct))
                  .map((u) => ({ nome: UF_NOMES[String(u.uf)], valor: pctDe(u, ind.pct), texto: textoInd(u) }))}
              />
            </div>
          </Secao>

          <Secao titulo={`Tabela dos estados do ${nome}`}>
            <Tabela linhas={estados.map((u) => ({ ...u, estado: UF_NOMES[String(u.uf)] }))} ordem="eleitorado" colunas={COLUNAS_UF} />
            <p style={{ fontSize: 13, opacity: 0.75 }}>QE = quociente eleitoral, os votos que custam uma cadeira.</p>
            <p style={{ fontWeight: 700, margin: "14px 0 0" }}>Abrir o estado</p>
            <Chips valor="" opcoes={estados.map((u) => String(u.uf))} aoMudar={abrirUf} nome={(u) => UF_NOMES[u]} />
          </Secao>
        </>
      )}
    </>
  );
}
