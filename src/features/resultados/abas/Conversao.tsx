"use client";
import React, { useMemo, useState } from "react";
import { carregarUf, n, t, useRecurso, type Resumo } from "../dados";
import { num, pct, titulo, UF_NOMES } from "../formato";
import { Dispersao, Ranking } from "../graficos";
import { Carregando, Chips, Filtros, Kpis, Nota, Secao, SeletorUf, Tabela } from "../pecas";
import { PORTES, pctDe } from "../apoio";

type Cargo = "df" | "de";
const NOME: Record<Cargo, string> = { df: "Dep. Federal", de: "Dep. Estadual" };

export default function Conversao({ resumo, uf, setUf }: { resumo: Resumo; uf: string; setUf: (u: string) => void }) {
  const [cargo, setCargo] = useState<Cargo>("df");
  const [porte, setPorte] = useState("Todos");
  const opcoes = resumo.ufs.map((u) => String(u.uf)).filter((u) => u !== "zz");
  const dados = useRecurso(uf, carregarUf);
  const br = resumo.brasil;
  const nome = NOME[cargo];

  const cidades = useMemo(
    () => (dados.dado?.cidades ?? []).filter((c) => n(c, "missao_pres") > 0 && (porte === "Todos" || c.porte === porte)),
    [dados.dado, porte],
  );
  const ufs = resumo.ufs.filter((u) => u.uf !== "zz" && n(u, `missao_${cargo}`) > 0);

  return (
    <>
      <Chips valor={cargo} opcoes={["df", "de"] as Cargo[]} aoMudar={setCargo} nome={(c) => `Renan → ${NOME[c]}`} />
      <Secao titulo="No Brasil" sub={`Quanto do voto do Renan para Presidente virou voto do Missão para ${nome}.`}>
        <Kpis
          itens={[
            { rotulo: "Votos do Renan", valor: num(n(br, "missao_pres")), missao: true },
            { rotulo: `Missão ${nome}`, valor: num(n(br, `missao_${cargo}`)), sub: "nominal + legenda", missao: true },
            { rotulo: "Aproveitamento", valor: pct(n(br, `aproveitamento_${cargo}`)), sub: `votos ${nome} ÷ votos do Renan`, missao: true },
          ]}
        />
        <Nota>
          Aproveitamento acima de 100% quer dizer que a candidatura a deputado teve mais votos que o Renan naquele lugar (puxador local). Abaixo, há
          eleitor que escolheu o Renan e votou em outro partido para deputado.
        </Nota>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
          <div>
            <p style={{ fontWeight: 700, margin: "6px 0 10px" }}>Por estado</p>
            <Ranking
              max={1}
              itens={[...ufs]
                .sort((a, b) => n(b, `aproveitamento_${cargo}`) - n(a, `aproveitamento_${cargo}`))
                .map((u) => ({
                  nome: UF_NOMES[String(u.uf)],
                  valor: n(u, `aproveitamento_${cargo}`),
                  texto: `${pct(n(u, `aproveitamento_${cargo}`))} · ${num(n(u, `missao_${cargo}`))} de ${num(n(u, "missao_pres"))}`,
                }))}
            />
          </div>
          <div>
            <p style={{ fontWeight: 700, margin: "6px 0 10px" }}>Por porte de cidade (Brasil)</p>
            <Ranking
              max={1}
              itens={PORTES.map((p) => {
                const l = resumo.porte.find((x) => x.porte === p);
                return {
                  nome: p,
                  valor: n(l, `aproveitamento_${cargo}`),
                  texto: `${pct(n(l, `aproveitamento_${cargo}`))} · ${num(n(l, `missao_${cargo}`))} de ${num(n(l, "missao_pres"))}`,
                };
              })}
            />
          </div>
        </div>
      </Secao>

      <Secao titulo="Cidade por cidade" sub="Cada ponto é uma cidade do estado; tamanho = eleitorado. Acima da linha tracejada, a candidatura a deputado superou o Renan.">
        <Filtros>
          <SeletorUf uf={uf} opcoes={opcoes} aoMudar={setUf} />
        </Filtros>
        <Chips valor={porte} opcoes={["Todos", ...PORTES]} aoMudar={setPorte} />
        {dados.dado ? (
          <>
            <Dispersao
              rotuloX="Renan (% dos válidos)"
              rotuloY={`Missão ${nome} (% dos válidos)`}
              pontos={cidades.map((c) => ({
                id: String(c.municipio_codigo),
                x: pctDe(c, "pct_missao_pres"),
                y: pctDe(c, `pct_missao_${cargo}`),
                tamanho: n(c, "eleitorado"),
                texto: `${titulo(t(c, "municipio_nome"))}: Renan ${num(n(c, "missao_pres"))} (${pct(pctDe(c, "pct_missao_pres"), 2)}) · ${nome} ${num(n(c, `missao_${cargo}`))} (${pct(pctDe(c, `pct_missao_${cargo}`), 2)})`,
              }))}
            />
            <p style={{ fontWeight: 700, margin: "18px 0 8px" }}>Onde há mais voto do Renan para converter</p>
            <Tabela
              linhas={cidades}
              ordem={`renan_nao_convertido_${cargo}`}
              colunas={[
                { chave: "municipio_nome", rotulo: "Município", tipo: "txt" },
                { chave: "porte", rotulo: "Porte", tipo: "txt" },
                { chave: "eleitorado", rotulo: "Eleitorado" },
                { chave: "missao_pres", rotulo: "Renan" },
                { chave: `missao_${cargo}`, rotulo: `Missão ${nome}` },
                { chave: `aproveitamento_${cargo}`, rotulo: "Aproveitamento", tipo: "barra", max: 1 },
                { chave: `renan_nao_convertido_${cargo}`, rotulo: "Não convertidos" },
                { chave: `pct_direita_${cargo}`, rotulo: "Direita %", tipo: "pct", valor: (l) => pctDe(l, `pct_direita_${cargo}`) },
                { chave: `pct_esquerda_${cargo}`, rotulo: "Esquerda %", tipo: "pct", valor: (l) => pctDe(l, `pct_esquerda_${cargo}`) },
              ]}
            />
          </>
        ) : (
          <Carregando erro={dados.erro} />
        )}
      </Secao>
    </>
  );
}
