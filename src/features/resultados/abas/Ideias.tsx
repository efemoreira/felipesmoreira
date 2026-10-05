"use client";
import React, { useMemo, useState } from "react";
import { C, FONT_ELITE, borda, sombra } from "@/lib/theme";
import { t, type Resumo } from "../dados";
import { num, UF_NOMES } from "../formato";
import { Escolha, Filtros, Kpis, Nota } from "../pecas";

export default function Ideias({ resumo }: { resumo: Resumo }) {
  const [tema, setTema] = useState("todos");
  const [uf, setUf] = useState("todos");
  const [prioridade, setPrioridade] = useState("todas");
  const temas = ["todos", ...Array.from(new Set(resumo.ideias.map((i) => t(i, "tema")))).sort()];
  const ufs = ["todos", ...Array.from(new Set(resumo.ideias.map((i) => t(i, "uf")))).sort()];

  const lista = useMemo(
    () =>
      resumo.ideias.filter(
        (i) => (tema === "todos" || i.tema === tema) && (uf === "todos" || i.uf === uf) && (prioridade === "todas" || i.prioridade === prioridade),
      ),
    [resumo.ideias, tema, uf, prioridade],
  );

  return (
    <>
      <Nota>
        Recomendações geradas a partir dos números, cada uma com a evidência que a disparou. É ponto de partida para o planejamento, não conclusão: confira a
        evidência antes de virar plano.
      </Nota>
      <Filtros>
        <Escolha rotulo="Tema" valor={tema} opcoes={temas} aoMudar={setTema} nome={(v) => (v === "todos" ? "Todos" : v)} />
        <Escolha rotulo="Estado" valor={uf} opcoes={ufs} aoMudar={setUf} nome={(v) => (v === "todos" ? "Todos" : UF_NOMES[v] ?? v)} />
        <Escolha rotulo="Prioridade" valor={prioridade} opcoes={["todas", "Alta", "Média"]} aoMudar={setPrioridade} nome={(v) => (v === "todas" ? "Todas" : v)} />
      </Filtros>
      <Kpis
        itens={[
          { rotulo: "Ideias", valor: num(lista.length), sub: `${num(lista.filter((i) => i.prioridade === "Alta").length)} de prioridade alta`, missao: true },
          ...temas.slice(1).map((tm) => ({ rotulo: tm, valor: num(lista.filter((i) => i.tema === tm).length) })),
        ]}
      />
      <details style={{ margin: "10px 0 16px" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600, minHeight: 44, display: "flex", alignItems: "center" }}>Como as ideias são geradas</summary>
        <Nota>
          <p style={{ margin: "0 0 6px" }}><b>Legenda:</b> legenda ≥ 12% do voto do Missão sem candidato com 10% do QE (faltam nomes); legenda ≥ 2× a média dos partidos (o eleitor procura a marca); legenda ≤ 4% com um puxador ≥ 60% dos votos (dependência).</p>
          <p style={{ margin: "0 0 6px" }}><b>Cadeira:</b> entre 60% e 80% do QE (perto das sobras) ou próxima cadeira a menos de 25% de um QE.</p>
          <p style={{ margin: "0 0 6px" }}><b>Conversão:</b> menos de 35% dos votos do Renan viraram voto do Missão para deputado, com o Renan acima de 25% do QE.</p>
          <p style={{ margin: 0 }}><b>Vereador 2028:</b> melhor votação de deputado ≥ 80% do QE de vereador estimado; ou só a legenda ≥ 30% do QE; ou o Renan ≥ 1 QE com o partido abaixo de 50%.</p>
        </Nota>
      </details>
      <div style={{ display: "grid", gap: 14 }}>
        {lista.slice(0, 200).map((i, k) => (
          <article key={k} style={{ background: i.prioridade === "Alta" ? C.gold2 : C.cream, border: borda(C.ink), boxShadow: sombra("rente"), padding: "12px 14px" }}>
            <p style={{ fontFamily: FONT_ELITE, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", margin: "0 0 6px" }}>
              {t(i, "tema")} · {t(i, "estado")}
              {t(i, "municipio") && ` · ${t(i, "municipio")}`} · prioridade {t(i, "prioridade").toLowerCase()}
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.45, margin: "0 0 8px", fontWeight: 600 }}>{t(i, "ideia")}</p>
            <p style={{ fontSize: 14, lineHeight: 1.45, margin: 0, opacity: 0.85 }}>{t(i, "evidencia")}</p>
          </article>
        ))}
      </div>
    </>
  );
}
