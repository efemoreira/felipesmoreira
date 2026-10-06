"use client";
import React, { useMemo, useState } from "react";
import { carregarUf, n, t, useRecurso, type Resumo } from "../dados";
import { num, titulo, UF_NOMES } from "../formato";
import { BarrasQuociente } from "../graficos";
import { Carregando, Chips, Filtros, Kpis, Nota, Secao, SeletorUf, Tabela } from "../pecas";
import { PORTES } from "../apoio";

type Cargo = "df" | "de";
const SITUACOES = ["Missão já faria vereador", "Missão perto (80% do QE)", "Só com os votos do Renan", "Abaixo do quociente"];

export default function Cadeiras({ resumo, uf, setUf }: { resumo: Resumo; uf: string; setUf: (u: string) => void }) {
  const [vista, setVista] = useState<"dep" | "ver" | "regras">("dep");
  const [cargo, setCargo] = useState<Cargo>("df");
  const [porte, setPorte] = useState("Todos");
  const [ordemVer, setOrdemVer] = useState<"missao" | "renan">("missao");
  const opcoes = resumo.ufs.map((u) => String(u.uf)).filter((u) => u !== "zz" && u !== "df");
  const ufVer = uf === "df" ? "sp" : uf;
  const dados = useRecurso(vista === "ver" ? ufVer : null, carregarUf);
  const br = resumo.brasil;
  const ufs = resumo.ufs.filter((u) => u.uf !== "zz" && n(u, `qe_${cargo}`) > 0);

  const cidades = useMemo(
    () => (dados.dado?.cidades ?? []).filter((c) => n(c, "qe_ver_2028_est") > 0 && (porte === "Todos" || c.porte === porte)),
    [dados.dado, porte],
  );

  return (
    <>
      <Chips
        valor={vista}
        opcoes={["dep", "ver", "regras"] as ("dep" | "ver" | "regras")[]}
        aoMudar={setVista}
        nome={(v) => ({ dep: "Deputados (por estado)", ver: "Vereadores (por cidade)", regras: "Como funciona" })[v]}
      />

      {vista === "dep" && (
        <>
          <Chips valor={cargo} opcoes={["df", "de"] as Cargo[]} aoMudar={setCargo} nome={(c) => (c === "df" ? "Deputado Federal" : "Deputado Estadual/Distrital")} />
          <Kpis
            itens={[
              { rotulo: "Cadeiras no país", valor: num(n(br, `vagas_${cargo}`)) },
              { rotulo: "Missão: quocientes somados", valor: num(ufs.reduce((s, u) => s + (n(u, `qe_atingidos_${cargo}`) || 0), 0), 2), missao: true },
              { rotulo: "Missão: eleitos", valor: num(n(br, `eleitos_${cargo}`) || 0), sub: "lista oficial + totalização final", missao: true },
              { rotulo: "Estados com ≥ 80% do QE", valor: num(ufs.filter((u) => n(u, `qe_atingidos_${cargo}`) >= 0.8).length), sub: "podem disputar sobras", missao: true },
            ]}
          />
          <Secao explica="cadeiras-qe" titulo="Quocientes atingidos" sub="Em quocientes eleitorais: 1,00 = uma cadeira. O roxo mostra os votos do Renan no estado, como se tivessem ido todos para o partido.">
            <BarrasQuociente
              textoRenan="votos do Renan no estado"
              linhas={[...ufs]
                .sort((a, b) => n(b, `qe_atingidos_${cargo}`) - n(a, `qe_atingidos_${cargo}`))
                .map((u) => ({
                  nome: UF_NOMES[String(u.uf)],
                  qe: n(u, `qe_${cargo}`),
                  nominal: n(u, `missao_nom_${cargo}`) || 0,
                  legenda: n(u, `missao_leg_${cargo}`) || 0,
                  renan: n(u, "missao_pres"),
                }))}
            />
          </Secao>
          <Secao titulo="Tabela">
            <Tabela
              linhas={ufs.map((u) => ({ ...u, estado: UF_NOMES[String(u.uf)] }))}
              ordem={`qe_atingidos_${cargo}`}
              colunas={[
                { chave: "estado", rotulo: "Estado", tipo: "txt" },
                { chave: `vagas_${cargo}`, rotulo: "Vagas" },
                { chave: `validos_${cargo}`, rotulo: "Votos válidos" },
                { chave: `qe_${cargo}`, rotulo: "QE (votos/cadeira)" },
                { chave: `eleitores_por_cadeira_${cargo}`, rotulo: "Eleitores/cadeira" },
                { chave: `missao_nom_${cargo}`, rotulo: "Nominal" },
                { chave: `missao_leg_${cargo}`, rotulo: "Legenda" },
                { chave: `missao_${cargo}`, rotulo: "Missão total" },
                { chave: `qe_atingidos_${cargo}`, rotulo: "QE atingidos", tipo: "dec" },
                { chave: `eleitos_${cargo}`, rotulo: "Eleitos" },
                { chave: `faltam_80pct_qe_${cargo}`, rotulo: "Faltam p/ 80% QE" },
                { chave: `faltam_proximo_qe_${cargo}`, rotulo: "Faltam p/ próx. QE" },
                { chave: `minimo_individual_${cargo}`, rotulo: "Mín. por candidato" },
                { chave: `renan_em_qe_${cargo}`, rotulo: "Renan em QE", tipo: "dec" },
              ]}
            />
          </Secao>
        </>
      )}

      {vista === "ver" && (
        <>
          <Filtros>
            <SeletorUf uf={ufVer} opcoes={opcoes} aoMudar={setUf} />
          </Filtros>
          <Chips valor={porte} opcoes={["Todos", ...PORTES]} aoMudar={setPorte} />
          {!dados.dado ? (
            <Carregando erro={dados.erro} />
          ) : (
            <>
              <Kpis
                itens={[
                  { rotulo: "Cadeiras de vereador", valor: num(cidades.reduce((s, c) => s + (n(c, "vagas_ver") || 0), 0)), sub: `${num(cidades.length)} cidades` },
                  ...SITUACOES.slice(0, 2).map((s) => ({ rotulo: s, valor: num(cidades.filter((c) => c.situacao_vereador === s).length), missao: true })),
                  {
                    rotulo: "Votos do Renan fariam vereador",
                    valor: `${num(cidades.filter((c) => c.renan_faz_vereador === "Sim").length)} cidades`,
                    sub: `${num(cidades.reduce((s, c) => s + (n(c, "renan_vereadores") || 0), 0))} cadeiras no total`,
                    missao: true,
                  },
                ]}
              />
              <Secao explica="vereador-2028" titulo="Cidades mais perto de 1 vereador" sub="QE de vereador estimado para 2028. Ouro = voto nominal do Missão para deputado; laranja = legenda; roxo = votos do Renan como se fossem para vereador.">
                <Chips valor={ordemVer} opcoes={["missao", "renan"] as ("missao" | "renan")[]} aoMudar={setOrdemVer} nome={(o) => (o === "missao" ? "Ordenar pelo Missão" : "Ordenar pelo Renan")} />
                <BarrasQuociente
                  textoRenan="votos do Renan como se fossem para vereador"
                  linhas={[...cidades]
                    .sort((a, b) => (ordemVer === "missao" ? n(b, "qe_atingidos_ver") - n(a, "qe_atingidos_ver") : n(b, "renan_em_qe_ver") - n(a, "renan_em_qe_ver")))
                    .slice(0, 25)
                    .map((c) => ({
                      nome: titulo(t(c, "municipio_nome")),
                      qe: n(c, "qe_ver_2028_est"),
                      nominal: n(c, "missao_melhor_nom") || 0,
                      legenda: n(c, "missao_melhor_leg") || 0,
                      renan: n(c, "missao_pres"),
                    }))}
                />
              </Secao>
              <Secao titulo="Tabela de cidades">
                <Tabela
                  linhas={cidades}
                  ordem="qe_atingidos_ver"
                  colunas={[
                    { chave: "municipio_nome", rotulo: "Município", tipo: "txt" },
                    { chave: "porte", rotulo: "Porte", tipo: "txt" },
                    { chave: "eleitorado", rotulo: "Eleitorado" },
                    { chave: "vagas_ver", rotulo: "Vagas" },
                    { chave: "qe_ver_2024", rotulo: "QE 2024" },
                    { chave: "qe_ver_2028_est", rotulo: "QE 2028 (est.)" },
                    { chave: "eleitores_por_vereador", rotulo: "Eleitores/vaga" },
                    { chave: "missao_melhor_nom", rotulo: "Nominal" },
                    { chave: "missao_melhor_leg", rotulo: "Legenda" },
                    { chave: "qe_atingidos_ver", rotulo: "QE de vereador", tipo: "barra", max: 2 },
                    { chave: "faltam_80pct_qe_ver", rotulo: "Faltam p/ 80%" },
                    { chave: "missao_pres", rotulo: "Votos do Renan" },
                    { chave: "renan_em_qe_ver", rotulo: "Renan em QE", tipo: "barra", max: 2 },
                    { chave: "renan_faz_vereador", rotulo: "Renan faria?", tipo: "txt" },
                    { chave: "situacao_vereador", rotulo: "Situação", tipo: "txt" },
                  ]}
                />
              </Secao>
            </>
          )}
        </>
      )}

      {vista === "regras" && (
        <Nota>
          <p style={{ margin: "0 0 8px" }}><b>Quociente eleitoral (QE)</b> = votos válidos ÷ número de vagas. É o custo de uma cadeira.</p>
          <p style={{ margin: "0 0 8px" }}><b>Quociente partidário</b> = votos do partido (nominal + legenda) ÷ QE. A parte inteira são as cadeiras garantidas.</p>
          <p style={{ margin: "0 0 8px" }}><b>Mínimo individual:</b> para ocupar vaga do quociente, o candidato precisa de pelo menos 10% do QE em votos nominais.</p>
          <p style={{ margin: "0 0 8px" }}><b>Sobras:</b> disputam as vagas restantes os partidos com pelo menos 80% do QE e candidatos com pelo menos 20% do QE (Lei 14.211/2021).</p>
          <p style={{ margin: 0 }}>
            <b>Vereador 2028:</b> o QE de 2024 de cada cidade, ajustado pela variação do comparecimento até 2026. A comparação usa a melhor votação do Missão para
            deputado em 2026 como sinal de força local. É estimativa para planejar, não previsão de resultado.
          </p>
        </Nota>
      )}
    </>
  );
}
