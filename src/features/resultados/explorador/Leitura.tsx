"use client";
import React, { useMemo } from "react";
import { DADO, PAINEL_DADOS as P } from "@/lib/theme";
import { n, t, type Linha, type Resumo } from "../dados";
import { num, pct, titulo, UF_NOMES } from "../formato";
import { Explica, cartao, kicker, linkBotao } from "../pecas";
import { DISPUTA, NOME_PRIORIDADE, acaoDe, cenarios2028, conversaoReferencia, passou, pesoNaCidade, prioridadesDoEstado, type Cenarios, type NivelLeitura } from "../leitura";
import { normalizar, type Caminho } from "./niveis";

/**
 * A leitura do lugar, logo abaixo do mapa: o que passou (1º e 2º turno juntos),
 * o que fazer (uma regra com número, em qualquer nível) e 2028 (vereador em
 * três cenários). As contas moram em `leitura.ts`.
 */
export function Leitura({
  nivel,
  nome,
  linha,
  pai,
  resumo,
  cidades,
  irmaos,
  filhosUf,
  caminho,
  ir,
}: {
  nivel: NivelLeitura;
  nome: string;
  linha: Linha;
  pai?: { nome: string; linha: Linha };
  resumo: Resumo;
  /** as cidades do estado (vazio acima do estado) */
  cidades: Linha[];
  /** os lugares do mesmo nível: cidades do estado ou bairros da cidade */
  irmaos: Linha[];
  /** os estados que estão dentro (Brasil, região) */
  filhosUf: Linha[];
  caminho: Caminho;
  ir: (c: Caminho) => void;
}) {
  const convRef = useMemo(() => conversaoReferencia(cidades), [cidades]);
  const fatos = passou(linha, nivel, pai, resumo.fidelidade?.referencia);
  const acao = acaoDe(linha, nivel, { convRef, irmaos });
  /* bairro: vereador é da cidade inteira — o cenário é o da cidade, e o bairro mostra quanto pesa nela */
  const cen = nivel === "bairro" ? cenarios2028(pai?.linha, "cidade", convRef) : cenarios2028(linha, nivel, convRef);
  const peso = nivel === "bairro" ? pesoNaCidade(linha, pai?.linha) : null;
  const estado = useMemo(() => (nivel === "estado" && cidades.length ? prioridadesDoEstado(cidades, convRef) : null), [nivel, cidades, convRef]);

  return (
    <section aria-label={`Leitura de ${nome}`} style={{ marginTop: 22 }}>
      <h2 style={{ fontSize: 19, fontWeight: 800, margin: "0 0 2px" }}>Leitura de {nome}</h2>
      <p style={{ fontSize: 14, color: P.tintaSuave, margin: "0 0 4px" }}>1º e 2º turno juntos: o que aconteceu, o que fazer e o que dá para alcançar em 2028.</p>
      <Explica id="leitura" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 12, marginTop: 8 }}>
        <div style={{ ...cartao, padding: "12px 14px" }}>
          <p style={{ ...kicker, margin: 0 }}>O que passou</p>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18, fontSize: 14.5, lineHeight: 1.5, display: "grid", gap: 6 }}>
            {fatos.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </div>

        <div style={{ ...cartao, padding: "12px 14px", background: P.realce, borderLeft: `4px solid ${P.missao}` }}>
          <p style={{ ...kicker, margin: 0, color: P.tinta }}>O que fazer</p>
          {acao && (
            <>
              <p style={{ fontSize: 20, fontWeight: 800, margin: "4px 0 0", lineHeight: 1.2 }}>{acao.acao}</p>
              <p style={{ fontSize: 13, fontWeight: 700, margin: "2px 0 0", color: P.tintaSuave }}>Prioridade {NOME_PRIORIDADE[acao.prioridade].toLowerCase()}</p>
              <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "6px 0 0" }}>{acao.porque}</p>
            </>
          )}
          {estado && (
            <>
              <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "6px 0 0" }}>{estado.porAcao.map(([a, q]) => `${a}: ${num(q)}`).join(" · ")}.</p>
              {estado.primeiras.length > 0 && (
                <>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: "8px 0 2px" }}>Primeiras da fila (prioridade alta, mais voto do Renan):</p>
                  <ol style={{ margin: 0, paddingLeft: 18, fontSize: 14.5, lineHeight: 1.4 }}>
                    {estado.primeiras.map((c) => (
                      <li key={c.id}>
                        <button type="button" style={{ ...linkBotao, padding: "2px 0", minHeight: 36 }} onClick={() => ir({ ...normalizar({ uf: caminho.uf }), cidade: c.id })}>
                          {titulo(c.nome)}
                        </button>{" "}
                        — {c.acao.acao.toLowerCase()}
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </>
          )}
          {(nivel === "brasil" || nivel === "regiao") && <OndeAgir ufs={filhosUf} ir={ir} />}
        </div>

        <div style={{ ...cartao, padding: "12px 14px" }}>
          <p style={{ ...kicker, margin: 0 }}>Para 2028 · vereador</p>
          {peso && pai && (
            <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "6px 0 0" }}>
              Vereador é eleito pela cidade inteira. {nome} tem <b>{pct(peso.renan, 1)}</b> do voto do Renan em {pai.nome} e <b>{pct(peso.fieis, 1)}</b> dos fiéis do 2º turno. A chapa da cidade:
            </p>
          )}
          {cen && <CenariosQE c={cen} convRef={convRef} />}
          {!cen && (nivel === "cidade" || nivel === "bairro") && <p style={{ fontSize: 14.5, margin: "6px 0 0" }}>Sem QE de vereador estimado aqui (no Distrito Federal não há vereador).</p>}
          {estado && estado.alcance.total > 0 && (
            <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "6px 0 0" }}>
              Cidades com a chapa a 80% do QE ou mais, de {num(estado.alcance.total)}: <b>{num(estado.alcance.repetir)}</b> repetindo 2026, <b>{num(estado.alcance.central)}</b> convertendo como o quartil de cima do estado ({num(convRef * 100)} de cada 100 votos do Renan), <b>{num(estado.alcance.teto)}</b> com todo o voto do Renan.
            </p>
          )}
          {(nivel === "brasil" || nivel === "regiao") && (
            <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "6px 0 0" }}>
              Com o voto do Missão para deputado, a chapa já faria <b>{num(n(linha, "ver28_missao") || 0)}</b> vereadores em {num(n(linha, "cidades_ver28_missao") || 0)} cidades; outras {num(n(linha, "cidades_ver28_perto") || 0)} estão entre 80% e 100% do QE. Com todo o voto do Renan: {num(n(linha, "ver28_renan") || 0)} em {num(n(linha, "cidades_ver28_renan") || 0)} cidades.
            </p>
          )}
          <p style={{ fontSize: 12.5, lineHeight: 1.45, margin: "8px 0 0", color: P.tintaSuave }}>Cenário, não previsão: QE de 2028 estimado pelo eleitorado e votação de deputado de 2026 no lugar da de vereador.</p>
        </div>
      </div>
    </section>
  );
}

/** Três barras em QE, com as marcas de 80% (entra na disputa) e 100% (uma vaga pelo quociente). */
function CenariosQE({ c, convRef }: { c: Cenarios; convRef: number }) {
  const teto = Math.max(1.2, c.teto * 1.05, c.repetir * 1.05);
  const linhas: [string, number, string][] = [
    ["Repetindo 2026", c.repetir, "a melhor chapa de deputado do Missão aqui"],
    [
      "Central",
      c.central,
      !Number.isFinite(convRef)
        ? "sem régua de conversão no estado"
        : c.central <= c.repetir
          ? `aqui já se converte mais que o quartil de cima do estado (${num(convRef * 100)} de cada 100 votos do Renan): o central é o que já aconteceu`
          : `convertendo ${num(convRef * 100)} de cada 100 votos do Renan, como o quartil de cima do estado`,
    ],
    ["Teto", c.teto, "todo o voto do Renan"],
  ];
  return (
    <>
      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
        {linhas.map(([rotulo, v, ajuda]) => (
          <div key={rotulo}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, gap: 8 }}>
              <span style={{ fontWeight: 700 }}>{rotulo}</span>
              <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700 }}>{Number.isFinite(v) ? `${num(v, 2)} QE` : "—"}</span>
            </div>
            <div style={{ position: "relative", height: 10, background: P.fundo, borderRadius: 5, marginTop: 3 }} aria-hidden="true">
              <span style={{ position: "absolute", inset: 0, width: `${Math.min(100, ((Number.isFinite(v) ? v : 0) / teto) * 100)}%`, background: v >= DISPUTA ? P.missao : DADO.missao, borderRadius: 5, opacity: v >= DISPUTA ? 1 : 0.55 }} />
              {[DISPUTA, 1].map((m) => (
                  <span key={m} style={{ position: "absolute", left: `${(m / teto) * 100}%`, top: -3, bottom: -3, width: 2, background: P.tinta }} />
                ))}
            </div>
            <p style={{ fontSize: 12.5, margin: "2px 0 0", color: P.tintaSuave }}>{ajuda}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12.5, margin: "6px 0 0", color: P.tintaSuave }}>Marcas: 80% do QE (o partido entra na disputa das vagas) e 1 QE (uma vaga pelo quociente).</p>
    </>
  );
}

/** Brasil e região: os estados onde a chapa está mais perto de vereador, depois os de mais base fiel. */
function OndeAgir({ ufs, ir }: { ufs: Linha[]; ir: (c: Caminho) => void }) {
  const fila = [...ufs]
    .filter((u) => String(u.uf) !== "zz")
    .map((u) => ({ u, perto: (n(u, "cidades_ver28_missao") || 0) + (n(u, "cidades_ver28_perto") || 0), fieis: n(u, "t2_nulos14") || 0 }))
    .sort((a, b) => b.perto - a.perto || b.fieis - a.fieis)
    .slice(0, 5);
  if (!fila.length) return null;
  return (
    <>
      <p style={{ fontSize: 14.5, lineHeight: 1.5, margin: "6px 0 0" }}>Onde agir primeiro: os estados com mais cidades em que a chapa chega a 80% do QE de vereador; no empate, mais base fiel no 2º turno.</p>
      <ol style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 14.5, lineHeight: 1.4 }}>
        {fila.map(({ u, perto, fieis }) => (
          <li key={t(u, "uf")}>
            <button type="button" style={{ ...linkBotao, padding: "2px 0", minHeight: 36 }} onClick={() => ir(normalizar({ uf: t(u, "uf") }))}>
              {UF_NOMES[t(u, "uf")] ?? t(u, "uf")}
            </button>{" "}
            — {num(perto)} {perto === 1 ? "cidade" : "cidades"} · {num(fieis)} fiéis
          </li>
        ))}
      </ol>
    </>
  );
}
