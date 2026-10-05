"use client";
import React, { useMemo, useState } from "react";
import { C, DADO } from "@/lib/theme";
import { carregarMapa, carregarUf, n, t, useRecurso, type Resumo } from "../dados";
import { num, pct, titulo, UF_NOMES } from "../formato";
import { BarrasQuociente, MapaCoropletico, Ranking } from "../graficos";
import { Carregando, Chips, Filtros, Kpis, Nota, Secao, SeletorUf, Tabela } from "../pecas";

type Cargo = "df" | "de";
const NOME: Record<Cargo, string> = { df: "Deputado Federal", de: "Deputado Estadual/Distrital" };

export default function Legenda({ resumo, uf, setUf }: { resumo: Resumo; uf: string; setUf: (u: string) => void }) {
  const [cargo, setCargo] = useState<Cargo>("df");
  const br = resumo.brasil;
  const opcoes = resumo.ufs.map((u) => String(u.uf)).filter((u) => u !== "zz");
  const dados = useRecurso(uf, carregarUf);
  const mapa = useRecurso(uf, carregarMapa);
  const cidades = useMemo(() => dados.dado?.cidades ?? [], [dados.dado]);

  const legGeral = (c: Cargo) => n(br, `legenda_${c}`) / n(br, `validos_${c}`);
  const legMissao = (c: Cargo) => n(br, `missao_leg_${c}`) / n(br, `missao_${c}`);
  const partidos = resumo.legendaPartidos.filter((p) => p.cargo === NOME[cargo]).slice(0, 20);
  const ufs = resumo.ufs.filter((u) => u.uf !== "zz" && n(u, `missao_${cargo}`) > 0);

  const valores: Record<string, number> = {};
  const rotulos: Record<string, string> = {};
  for (const c of cidades) {
    const cod = t(c, "codigo_ibge");
    valores[cod] = n(c, `pct_leg_missao_${cargo}`);
    rotulos[cod] = `${titulo(t(c, "municipio_nome"))}: legenda ${num(n(c, `missao_leg_${cargo}`))} (${pct(valores[cod])} do voto do Missão)`;
  }

  return (
    <>
      <Secao titulo="Voto de legenda" sub="Quem votou só no 14, sem escolher candidato.">
        <Kpis
          itens={(["df", "de"] as Cargo[]).flatMap((c) => [
            { rotulo: `Legenda ${c === "df" ? "Dep. Federal" : "Dep. Estadual"}`, valor: num(n(br, `missao_leg_${c}`)), sub: `${pct(legMissao(c))} dos votos do Missão`, missao: true },
            { rotulo: `Média dos partidos (${c.toUpperCase()})`, valor: pct(legGeral(c)), sub: `o Missão tem ${num(legMissao(c) / legGeral(c), 1)}× a média` },
          ])}
        />
        <Nota>
          <b>Como funciona:</b> a legenda soma no quociente partidário (quantas cadeiras o partido ganha) e ajuda a passar dos 80% do QE para disputar
          sobras. Mas quem assume é decidido só pelo voto nominal, e o candidato precisa de pelo menos 10% do QE. Legenda alta com candidatos fracos é
          risco de ter a cadeira e não ter quem ocupe. Em 2028 (vereador) a regra é a mesma.
        </Nota>
      </Secao>

      <Chips valor={cargo} opcoes={["df", "de"] as Cargo[]} aoMudar={setCargo} nome={(c) => NOME[c]} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
        <Secao titulo="Partidos" sub="% do voto de cada partido que foi de legenda (top 20). Partidos pequenos e ideológicos têm legenda alta.">
          <Ranking
            itens={partidos.map((p) => ({
              nome: t(p, "partido_sigla"),
              valor: n(p, "pct_legenda"),
              texto: `${pct(n(p, "pct_legenda"))} · ${num(n(p, "votos_legenda"))}`,
              cor: p.grupo === "Missão" ? DADO.missao : DADO.outros,
            }))}
          />
        </Secao>
        <Secao titulo="Missão por estado" sub="% do voto do Missão que foi só no 14.">
          <Ranking
            itens={[...ufs]
              .sort((a, b) => n(b, `pct_leg_missao_${cargo}`) - n(a, `pct_leg_missao_${cargo}`))
              .map((u) => ({
                nome: UF_NOMES[String(u.uf)],
                valor: n(u, `pct_leg_missao_${cargo}`),
                texto: `${pct(n(u, `pct_leg_missao_${cargo}`))} · ${num(n(u, `missao_leg_${cargo}`))}`,
              }))}
          />
        </Secao>
      </div>

      <Secao titulo="Por estado">
        <Tabela
          linhas={ufs.map((u) => ({ ...u, estado: UF_NOMES[String(u.uf)] }))}
          ordem={`missao_leg_${cargo}`}
          colunas={[
            { chave: "estado", rotulo: "Estado", tipo: "txt" },
            { chave: `missao_${cargo}`, rotulo: "Missão total" },
            { chave: `missao_nom_${cargo}`, rotulo: "Nominal" },
            { chave: `missao_leg_${cargo}`, rotulo: "Legenda" },
            { chave: `pct_leg_missao_${cargo}`, rotulo: "% legenda (Missão)", tipo: "pct" },
            { chave: `pct_leg_geral_${cargo}`, rotulo: "% legenda (todos)", tipo: "pct" },
            { chave: `indice_legenda_${cargo}`, rotulo: "Índice", tipo: "dec", ajuda: "Quantas vezes o eleitor do Missão vota mais na legenda que a média" },
            { chave: `leg_por_100_renan_${cargo}`, rotulo: "Legenda / 100 do Renan", tipo: "dec" },
          ]}
        />
      </Secao>

      <Secao titulo="Por cidade">
        <Filtros>
          <SeletorUf uf={uf} opcoes={opcoes} aoMudar={setUf} />
        </Filtros>
        {dados.dado ? (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
              <MapaCoropletico mapa={mapa.dado} valores={valores} rotulos={rotulos} />
              <Ranking
                itens={[...cidades]
                  .sort((a, b) => n(b, `missao_leg_${cargo}`) - n(a, `missao_leg_${cargo}`))
                  .slice(0, 20)
                  .map((c) => ({
                    nome: titulo(t(c, "municipio_nome")),
                    valor: n(c, `missao_leg_${cargo}`),
                    texto: `${num(n(c, `missao_leg_${cargo}`))} · ${pct(n(c, `pct_leg_missao_${cargo}`))} do Missão`,
                  }))}
              />
            </div>
            <p style={{ fontWeight: 700, margin: "22px 0 4px" }}>Legenda e vereador em 2028</p>
            <p style={{ fontSize: 14, margin: "0 0 8px", color: C.ink }}>Quanto de uma cadeira de vereador o voto do Missão já cobre em cada cidade. Em 2024, a legenda foi em média 3% dos votos para vereador.</p>
            <BarrasQuociente
              textoRenan="votos do Renan na cidade como se fossem para vereador"
              linhas={[...cidades]
                .filter((c) => n(c, "qe_ver_2028_est") > 0)
                .sort((a, b) => n(b, "leg_em_qe_ver") - n(a, "leg_em_qe_ver"))
                .slice(0, 15)
                .map((c) => ({
                  nome: titulo(t(c, "municipio_nome")),
                  qe: n(c, "qe_ver_2028_est"),
                  nominal: n(c, "missao_melhor_nom") || 0,
                  legenda: n(c, "missao_melhor_leg") || 0,
                  renan: n(c, "missao_pres"),
                }))}
            />
          </>
        ) : (
          <Carregando erro={dados.erro} />
        )}
      </Secao>
    </>
  );
}
