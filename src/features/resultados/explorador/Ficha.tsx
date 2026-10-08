"use client";
import React, { useState } from "react";
import { DADO, FONT_DADOS, PAINEL_DADOS as P, RAIO_DADOS, fileteDados } from "@/lib/theme";
import { n, type Linha } from "../dados";
import { compacto, num, pct, pts } from "../formato";
import { BarrasGrupos } from "../graficos";
import { Chips, Legenda, cartao, kicker } from "../pecas";
import { GRUPOS, linhasGrupos } from "../apoio";
import type { IndicadorMapa } from "./indicadores";

/**
 * A ficha do lugar, ao lado do mapa: quem é, o número do que está pintado com
 * a comparação com o nível de cima, os três números do Missão numa frase, a
 * divisão dos votos e os maiores lá dentro. O resto (cadeira, legenda,
 * candidatos, vereador…) fica nas gavetas embaixo do mapa.
 */

export type ItemMaiores = { id: string; nome: string; linha: Linha; entra: boolean };

const razao = (a: number, b: number) => (b > 0 ? a / b : NaN);

export function Ficha({
  tipo,
  nome,
  sub,
  linha,
  pai,
  indicador,
  filhos,
  rotuloFilhos,
  aoEscolher,
  distrital = false,
}: {
  tipo: string;
  nome: string;
  sub?: string;
  linha: Linha;
  pai?: { nome: string; linha: Linha };
  indicador: IndicadorMapa;
  filhos: ItemMaiores[];
  rotuloFilhos: string;
  aoEscolher: (id: string) => void;
  distrital?: boolean;
}) {
  const [ordem, setOrdem] = useState<"pct" | "votos">("pct");
  const valor = indicador.pct?.(linha) ?? NaN;
  const valorPai = pai ? (indicador.pct?.(pai.linha) ?? NaN) : NaN;
  const renan = n(linha, "missao_pres");
  const df = n(linha, "missao_df");
  const aprov = razao(df, renan);
  const comPai = (v: number, vp: number) => (pai && Number.isFinite(v) && Number.isFinite(vp) ? `${pts(v - vp)} vs. ${pai.nome} (${pct(vp, 2)})` : undefined);

  const temVotos = !!indicador.votos;
  const ordemValida = temVotos ? ordem : "pct";
  const maiores = [...filhos]
    .map((f) => ({ ...f, v: ordemValida === "votos" ? (indicador.votos?.(f.linha) ?? NaN) : (indicador.pct?.(f.linha) ?? NaN) }))
    .filter((f) => Number.isFinite(f.v))
    .sort((a, b) => b.v - a.v)
    .slice(0, 8);
  const teto = Math.max(...maiores.map((m) => Math.abs(m.v)), 0) || 1;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div>
        <p style={{ ...kicker, margin: 0 }}>{tipo}</p>
        <h2 style={{ fontFamily: FONT_DADOS, fontSize: "clamp(22px, 5vw, 28px)", fontWeight: 800, lineHeight: 1.15, margin: "2px 0 0", color: P.tinta }}>{nome}</h2>
        {sub && <p style={{ fontSize: 14, color: P.tintaSuave, margin: "2px 0 0" }}>{sub}</p>}
      </div>

      {/* o que está pintado no mapa, para este lugar */}
      <div style={{ ...cartao, padding: "12px 14px" }}>
        <p style={{ ...kicker, margin: 0 }}>No mapa: {indicador.rotulo}</p>
        <p style={{ fontFamily: FONT_DADOS, fontWeight: 800, fontSize: 30, lineHeight: 1.1, margin: "4px 0 0", fontVariantNumeric: "tabular-nums", color: P.tinta }}>{indicador.formato(valor)}</p>
        <p style={{ fontSize: 13.5, color: P.tintaSuave, margin: "2px 0 0" }}>
          {indicador.unidade}
          {indicador.votos && Number.isFinite(indicador.votos(linha)) && <> · {num(indicador.votos(linha))} votos</>}
        </p>
        {pai && Number.isFinite(valorPai) && (
          <p style={{ fontSize: 13.5, margin: "6px 0 0", color: P.tinta }}>
            {indicador.divergente ? (
              <>
                {pai.nome}: {indicador.formato(valorPai)}
              </>
            ) : (
              <>
                <b>{pts(valor - valorPai)}</b> vs. {pai.nome} ({indicador.formato(valorPai)})
              </>
            )}
          </p>
        )}
      </div>

      {/* os três números do Missão, sempre os mesmos, em qualquer nível */}
      <div style={{ ...cartao, padding: "12px 14px", background: P.realce, borderLeft: `4px solid ${P.missao}` }}>
        <p style={{ ...kicker, margin: 0, color: P.tinta }}>O Missão aqui</p>
        <dl style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "6px 12px", margin: "6px 0 0", fontSize: 14.5, fontVariantNumeric: "tabular-nums" }}>
          <Par rotulo="Renan (Presidente)" valor={`${pct(razao(renan, n(linha, "validos_pres")), 2)} · ${compacto(renan)}`} nota={comPai(razao(renan, n(linha, "validos_pres")), pai ? razao(n(pai.linha, "missao_pres"), n(pai.linha, "validos_pres")) : NaN)} />
          <Par rotulo="Dep. Federal" valor={`${pct(razao(df, n(linha, "validos_df")), 2)} · ${compacto(df)}`} nota={comPai(razao(df, n(linha, "validos_df")), pai ? razao(n(pai.linha, "missao_df"), n(pai.linha, "validos_df")) : NaN)} />
          <Par
            rotulo={distrital ? "Dep. Distrital" : "Dep. Estadual"}
            valor={`${pct(razao(n(linha, "missao_de"), n(linha, "validos_de")), 2)} · ${compacto(n(linha, "missao_de"))}`}
          />
        </dl>
        {Number.isFinite(aprov) && renan > 0 && (
          <p style={{ fontSize: 14, lineHeight: 1.45, margin: "8px 0 0", color: P.tinta }}>
            De cada 100 votos do Renan aqui, <b>{num(Math.min(100, aprov * 100))}</b> foram para deputado federal do Missão.
          </p>
        )}
      </div>

      <div style={{ ...cartao, padding: "12px 14px" }}>
        <p style={{ ...kicker, margin: "0 0 6px" }}>Como os votos se dividiram</p>
        <Legenda itens={GRUPOS.slice(0, 4).map(([, nomeG, cor]) => [cor, nomeG])} />
        <BarrasGrupos linhas={linhasGrupos(linha, (c) => (distrital && c === "Deputado Estadual" ? "Deputado Distrital" : c))} />
      </div>

      {maiores.length > 0 && (
        <div style={{ ...cartao, padding: "12px 14px" }}>
          <p style={{ ...kicker, margin: 0 }}>
            {rotuloFilhos}: {indicador.rotulo}
          </p>
          {temVotos && <Chips valor={ordemValida} opcoes={["pct", "votos"] as ("pct" | "votos")[]} aoMudar={setOrdem} nome={(o) => (o === "pct" ? "Maior %" : "Mais votos")} />}
          <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 2 }}>
            {maiores.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  disabled={!m.entra}
                  onClick={() => aoEscolher(m.id)}
                  style={{
                    all: "unset",
                    boxSizing: "border-box",
                    display: "grid",
                    gridTemplateColumns: "minmax(0, 1fr) 90px auto",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    minHeight: 40,
                    padding: "4px 6px",
                    borderRadius: 6,
                    cursor: m.entra ? "pointer" : "default",
                    fontSize: 14,
                    color: P.tinta,
                  }}
                  className="mx-item"
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 600 }}>{m.nome}</span>
                  <span aria-hidden="true" style={{ height: 8, background: P.fundo, borderRadius: 4, overflow: "hidden" }}>
                    <span style={{ display: "block", height: "100%", width: `${(Math.abs(m.v) / teto) * 100}%`, background: indicador.divergente ? (m.v < 0 ? DADO.esquerda : DADO.direita) : DADO.missao }} />
                  </span>
                  <span style={{ fontVariantNumeric: "tabular-nums", textAlign: "right", minWidth: 58 }}>{ordemValida === "votos" ? compacto(m.v) : indicador.formato(m.v)}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function Par({ rotulo, valor, nota }: { rotulo: string; valor: string; nota?: string }) {
  return (
    <>
      <dt style={{ color: P.tinta }}>
        {rotulo}
        {nota && <span style={{ display: "block", fontSize: 12.5, color: P.tintaSuave }}>{nota}</span>}
      </dt>
      <dd style={{ margin: 0, fontWeight: 700, textAlign: "right", color: P.tinta }}>{valor}</dd>
    </>
  );
}

export const estiloBotaoTrilha: React.CSSProperties = {
  all: "unset",
  cursor: "pointer",
  minHeight: 44,
  display: "inline-flex",
  alignItems: "center",
  padding: "0 2px",
  fontFamily: FONT_DADOS,
  fontSize: 14.5,
  fontWeight: 600,
  color: P.tinta,
  textDecoration: "underline",
  textUnderlineOffset: 3,
};

export const caixaBusca: React.CSSProperties = { ...cartao, position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20, marginTop: 4, padding: 4, borderRadius: RAIO_DADOS, border: fileteDados(P.linhaForte) };
