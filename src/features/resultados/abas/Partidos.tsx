"use client";
import React, { useMemo, useState } from "react";
import { carregarBairros, carregarPartidos, carregarUf, n, t, temBairros, useRecurso, type Linha, type Resumo } from "../dados";
import { num, pct, titulo, UF_NOMES } from "../formato";
import { Carregando, Chips, Escolha, Filtros, Kpis, Nota, Secao, SeletorUf, Tabela, type Coluna } from "../pecas";
import { PERFIL } from "../apoio";

/**
 * De que é feito o voto de cada partido — legenda, um puxador ou uma chapa
 * distribuída — no país, no estado, na cidade ou no bairro. O Missão aparece
 * ao lado dos que elegeram, para ver se o caminho do partido é o dos que ganham.
 */

type Nivel = "brasil" | "estado" | "cidade" | "bairro";
const NIVEIS: [Nivel, string][] = [
  ["brasil", "Brasil"],
  ["estado", "Estado"],
  ["cidade", "Cidade"],
  ["bairro", "Bairro"],
];
const MISSAO = (l: Linha) => t(l, "grupo") === "Missão" || t(l, "partido_sigla").toUpperCase().startsWith("MISS");

export default function Partidos({ resumo, uf, setUf }: { resumo: Resumo; uf: string; setUf: (u: string) => void }) {
  const opcoesUf = resumo.ufs.map((u) => String(u.uf)).filter((u) => u !== "zz");
  const [nivel, setNivel] = useState<Nivel>("estado");
  const [cargo, setCargo] = useState<"df" | "de">("df");
  const [codigo, setCodigo] = useState("");
  const [bairro, setBairro] = useState("");

  const partidos = useRecurso(nivel === "brasil" ? null : uf, carregarPartidos);
  const dadosUf = useRecurso(nivel === "brasil" ? null : uf, carregarUf);
  const cidades = useMemo(() => [...(dadosUf.dado?.cidades ?? [])].sort((a, b) => n(b, "eleitorado") - n(a, "eleitorado")), [dadosUf.dado]);
  const lista = nivel === "bairro" ? cidades.filter((c) => temBairros(resumo, uf, c)) : cidades;
  const cod = codigo && lista.some((c) => String(c.municipio_codigo) === codigo) ? codigo : String(lista[0]?.municipio_codigo ?? "");
  const cidade = cidades.find((c) => String(c.municipio_codigo) === cod);
  const dadosB = useRecurso(nivel === "bairro" && cod ? `${uf}/${cod}` : null, carregarBairros);
  const bairros = useMemo(() => [...(dadosB.dado?.bairros ?? [])].sort((a, b) => n(b, "eleitorado") - n(a, "eleitorado")), [dadosB.dado]);
  const bChave = bairro && bairros.some((b) => t(b, "bairro_chave") === bairro) ? bairro : t(bairros[0], "bairro_chave");
  const bLinha = bairros.find((b) => t(b, "bairro_chave") === bChave);
  const grupos = useMemo(() => partidos.dado?.grupos ?? {}, [partidos.dado]);

  /* as linhas do recorte e o total de válidos do cargo ali */
  const { linhas, validos, onde } = useMemo(() => {
    const ufLinha = resumo.ufs.find((u) => u.uf === uf);
    if (nivel === "brasil") {
      return { linhas: (resumo.partidosBrasil ?? []).filter((p) => p.cargo_key === cargo), validos: n(resumo.brasil, `validos_${cargo}`), onde: "Brasil" };
    }
    if (nivel === "estado") {
      return {
        linhas: (partidos.dado?.estado ?? []).filter((p) => p.cargo_key === cargo).map((p) => ({ ...p, grupo: grupos[t(p, "partido_sigla")] })),
        validos: n(ufLinha, `validos_${cargo}`),
        onde: UF_NOMES[uf] ?? uf,
      };
    }
    if (nivel === "cidade") {
      return {
        linhas: (partidos.dado?.cidades ?? []).filter((p) => p.cargo_key === cargo && String(p.municipio_codigo) === cod).map((p) => ({ ...p, grupo: grupos[t(p, "partido_sigla")] })),
        validos: n(cidade, `validos_${cargo}`),
        onde: titulo(t(cidade, "municipio_nome")),
      };
    }
    const idx = dadosB.dado?.bairros.indexOf(bLinha as Linha) ?? -1;
    return {
      linhas: (dadosB.dado?.partidos ?? []).filter((p) => p.cargo_key === cargo && n(p, "b") === idx).map((p) => ({ ...p, grupo: grupos[t(p, "partido_sigla")] })),
      validos: n(bLinha, `validos_${cargo}`),
      onde: `${t(bLinha, "bairro")}, ${titulo(t(cidade, "municipio_nome"))}`,
    };
  }, [nivel, cargo, uf, cod, resumo, partidos.dado, dadosB.dado, bLinha, cidade, grupos]);

  const tabela: Linha[] = linhas.map((p) => {
    const total = (n(p, "nominal") || 0) + (n(p, "legenda") || 0);
    return {
      ...p,
      total,
      pct_validos: total / validos,
      pct_legenda: (n(p, "legenda") || 0) / total,
      pct_puxador: n(p, "top_votos") / n(p, "nominal"),
      perfil_txt: PERFIL[t(p, "perfil")] ?? "",
    };
  });

  /* o Missão contra os que elegeram (estado e Brasil) ou contra os 5 maiores (cidade e bairro) */
  const missao = tabela.find(MISSAO);
  const elegeram = tabela.filter((p) => n(p, "eleitos") > 0 && !MISSAO(p));
  const refs = elegeram.length ? elegeram : [...tabela].filter((p) => !MISSAO(p)).sort((a, b) => n(b, "total") - n(a, "total")).slice(0, 5);
  const rotuloRef = elegeram.length ? "os partidos que elegeram" : "os 5 maiores";
  const media = (c: string) => {
    const v = refs.map((p) => n(p, c)).filter(Number.isFinite);
    return v.length ? v.reduce((s, x) => s + x, 0) / v.length : NaN;
  };
  const comNivel = (cols: Coluna[]) => cols.filter((c) => (nivel === "estado" || nivel === "brasil" ? true : !["eleitos", "acima_10qe", "puxador", "federacao"].includes(c.chave)));

  const carregando = nivel !== "brasil" && (!partidos.dado || !dadosUf.dado || (nivel === "bairro" && !dadosB.dado));

  return (
    <>
      <Nota>
        De que é feito o voto de cada partido: só o número (legenda), um puxador ou uma chapa de muitos nomes. Compare o Missão com quem elegeu para ver se o
        caminho do partido é o mesmo dos que ganham — e onde ele é diferente.
      </Nota>
      <Chips valor={nivel} opcoes={NIVEIS.map(([k]) => k)} aoMudar={setNivel} nome={(k) => NIVEIS.find(([x]) => x === k)?.[1] ?? k} />
      <Filtros>
        {nivel !== "brasil" && <SeletorUf uf={uf} opcoes={opcoesUf} aoMudar={(u) => { setUf(u); setCodigo(""); setBairro(""); }} />}
        {(nivel === "cidade" || nivel === "bairro") && lista.length > 0 && (
          <Escolha rotulo="Cidade" valor={cod} opcoes={lista.map((c) => String(c.municipio_codigo))} aoMudar={(c) => { setCodigo(c); setBairro(""); }} nome={(c) => titulo(t(lista.find((x) => String(x.municipio_codigo) === c), "municipio_nome"))} />
        )}
        {nivel === "bairro" && bairros.length > 0 && (
          <Escolha rotulo="Bairro" valor={bChave} opcoes={bairros.map((b) => t(b, "bairro_chave"))} aoMudar={setBairro} nome={(k) => t(bairros.find((b) => t(b, "bairro_chave") === k), "bairro")} />
        )}
      </Filtros>
      <Chips valor={cargo} opcoes={["df", "de"] as ("df" | "de")[]} aoMudar={setCargo} nome={(c) => (c === "df" ? "Dep. Federal" : uf === "df" && nivel !== "brasil" ? "Dep. Distrital" : "Dep. Estadual")} />

      {carregando ? (
        <Carregando erro={partidos.erro ?? dadosUf.erro ?? dadosB.erro} />
      ) : (
        <>
          <Secao titulo={`Missão × ${rotuloRef} — ${onde}`} explica="perfil">
            {missao ? (
              <Kpis
                itens={[
                  { rotulo: "Perfil do Missão", valor: t(missao, "perfil_txt") || "—", sub: `${rotuloRef}: ${maisComum(refs)}`, missao: true },
                  { rotulo: "% legenda", valor: pct(n(missao, "pct_legenda")), sub: `${rotuloRef}: ${pct(media("pct_legenda"))}`, missao: true },
                  { rotulo: "% do puxador", valor: pct(n(missao, "pct_puxador")), sub: `${rotuloRef}: ${pct(media("pct_puxador"))}`, missao: true },
                  { rotulo: "Candidatos com voto", valor: num(n(missao, "n_cand")), sub: `${rotuloRef}: ${num(media("n_cand"), 1)}`, missao: true },
                  ...(nivel === "estado" || nivel === "cidade"
                    ? [{ rotulo: "Nomes para 80% do voto", valor: num(n(missao, "n_80")), sub: `${rotuloRef}: ${num(media("n_80"), 1)}`, missao: true }]
                    : []),
                  ...(nivel === "estado" || nivel === "brasil"
                    ? [{ rotulo: "Nomes com 10% do QE", valor: num(n(missao, "acima_10qe") || 0), sub: `${rotuloRef}: ${num(media("acima_10qe"), 1)}`, missao: true }]
                    : []),
                  { rotulo: "% dos válidos", valor: pct(n(missao, "pct_validos"), 2), sub: `${num(n(missao, "total"))} votos` },
                ]}
              />
            ) : (
              <p style={{ opacity: 0.8 }}>O Missão não teve voto para este cargo aqui.</p>
            )}
          </Secao>

          <Secao titulo={`Perfil do voto dos partidos — ${onde}`} sub={nivel === "bairro" ? "Os 8 partidos mais votados do bairro neste cargo, e o Missão." : "Todos os partidos com voto neste cargo."} explica="perfil">
            <Tabela
              linhas={tabela}
              ordem="total"
              arquivo={`partidos-${nivel}-${cargo}`}
              colunas={comNivel([
                { chave: "partido_sigla", rotulo: "Partido", tipo: "txt" },
                { chave: "grupo", rotulo: "Grupo", tipo: "txt" },
                { chave: "total", rotulo: "Votos" },
                { chave: "pct_validos", rotulo: "% dos válidos", tipo: "pct" },
                { chave: "pct_legenda", rotulo: "% legenda", tipo: "pct" },
                { chave: "pct_puxador", rotulo: "% do puxador", tipo: "pct" },
                { chave: "puxador", rotulo: "Puxador", tipo: "txt" },
                { chave: "n_cand", rotulo: "Candidatos com voto" },
                { chave: "n_80", rotulo: "Nomes p/ 80%" },
                { chave: "perfil_txt", rotulo: "Perfil", tipo: "txt" },
                { chave: "eleitos", rotulo: "Eleitos" },
                { chave: "acima_10qe", rotulo: "Com 10% do QE", ajuda: "candidatos com o mínimo individual para ocupar vaga" },
                { chave: "federacao", rotulo: "Federação", tipo: "txt" },
              ]).filter((c) => !(nivel === "brasil" && ["pct_puxador", "n_80", "perfil_txt", "puxador", "federacao"].includes(c.chave)))}
            />
          </Secao>
        </>
      )}
    </>
  );
}

/** O perfil mais comum entre os partidos de referência. */
function maisComum(ls: Linha[]): string {
  const c = new Map<string, number>();
  for (const l of ls) {
    const p = t(l, "perfil_txt");
    if (p) c.set(p, (c.get(p) ?? 0) + 1);
  }
  const top = [...c.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? `${top[0].toLowerCase()} (${top[1]} de ${ls.length})` : "—";
}
