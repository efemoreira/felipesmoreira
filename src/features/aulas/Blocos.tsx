"use client";
import React from "react";
import { C, FONT_ALFA, FONT_ELITE, borda, sombra } from "@/lib/theme";
import type { Bloco } from "./tipos";

/**
 * Desenha os blocos de conteúdo de uma aula. Os tipos são fechados
 * (ver tipos.ts) e vêm prontos do painel — o site não decide conteúdo, só
 * apresentação.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/* rótulo de seção: mesma etiqueta de máquina de escrever do resto do site */
const Rotulo: React.FC<{ children: React.ReactNode; cor?: string }> = ({ children, cor = C.gold }) => (
  <p
    style={{
      fontFamily: FONT_ELITE,
      fontSize: 11,
      letterSpacing: 1.6,
      textTransform: "uppercase",
      color: cor,
      margin: "0 0 8px",
    }}
  >
    {children}
  </p>
);

/* caixa com borda grossa e sombra dura — a moldura padrão do cordel */
const Caixa: React.FC<{ cor: string; fundo?: string; children: React.ReactNode }> = ({
  cor,
  fundo = "rgba(0,0,0,.25)",
  children,
}) => (
  <div
    style={{
      border: borda(cor),
      background: fundo,
      padding: "14px 16px",
      margin: "0 0 18px",
      boxShadow: sombra("cartao", C.sombraNoite),
    }}
  >
    {children}
  </div>
);

const marcador = { color: C.gold, flex: "0 0 auto" } as const;
const itemLinha = { display: "flex", gap: 10, margin: "0 0 8px", lineHeight: 1.6 } as const;

export const Blocos: React.FC<{ blocos: Bloco[] }> = ({ blocos }) => (
  <>
    {blocos.map((b, i) => (
      <BlocoUm key={i} bloco={b} />
    ))}
  </>
);

const BlocoUm: React.FC<{ bloco: Bloco }> = ({ bloco }) => {
  switch (bloco.tipo) {
    case "texto":
      return <p style={{ margin: "0 0 16px", lineHeight: 1.75 }}>{bloco.texto}</p>;

    case "passos":
      return (
        <ol style={{ margin: "0 0 18px", padding: 0, listStyle: "none", counterReset: "passo" }}>
          {bloco.itens.map((it, i) => (
            <li key={i} style={{ ...itemLinha, alignItems: "flex-start" }}>
              <span
                style={{
                  ...marcador,
                  fontFamily: FONT_ALFA,
                  fontSize: 15,
                  minWidth: 26,
                  textAlign: "right",
                }}
                aria-hidden="true"
              >
                {i + 1}.
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ol>
      );

    case "lista":
      return (
        <div style={{ margin: "0 0 18px" }}>
          {bloco.titulo && <Rotulo>{bloco.titulo}</Rotulo>}
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {bloco.itens.map((it, i) => (
              <li key={i} style={itemLinha}>
                <span style={marcador} aria-hidden="true">
                  ▸
                </span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </div>
      );

    case "checklist":
      return (
        <Caixa cor="rgba(255,203,5,.28)">
          <Rotulo>{bloco.titulo}</Rotulo>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {bloco.itens.map((it, i) => (
              <li key={i} style={{ ...itemLinha, margin: i === bloco.itens.length - 1 ? 0 : "0 0 8px" }}>
                <span style={marcador} aria-hidden="true">
                  ☐
                </span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </Caixa>
      );

    case "nunca":
      return (
        <Caixa cor={C.erroBorda} fundo="rgba(194,84,63,.12)">
          <Rotulo cor={C.erro}>Nunca</Rotulo>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {bloco.itens.map((it, i) => (
              <li key={i} style={{ ...itemLinha, margin: i === bloco.itens.length - 1 ? 0 : "0 0 8px" }}>
                <span style={{ color: C.erro, flex: "0 0 auto" }} aria-hidden="true">
                  ✕
                </span>
                <span>{it}</span>
              </li>
            ))}
          </ul>
        </Caixa>
      );

    case "modelo":
      return (
        <Caixa cor="rgba(255,255,255,.18)" fundo="rgba(0,0,0,.4)">
          <Rotulo>{bloco.titulo}</Rotulo>
          {/* pre para o alinhamento do modelo sobreviver; rola sozinho no celular */}
          <pre
            style={{
              margin: 0,
              fontFamily: MONO,
              fontSize: 13.5,
              lineHeight: 1.8,
              color: C.cream,
              whiteSpace: "pre",
              overflowX: "auto",
            }}
          >
            {bloco.linhas.join("\n")}
          </pre>
        </Caixa>
      );

    case "aviso":
      return (
        <Caixa cor={C.gold} fundo="rgba(255,203,5,.1)">
          <Rotulo>Atenção</Rotulo>
          <p style={{ margin: 0, lineHeight: 1.7 }}>{bloco.texto}</p>
        </Caixa>
      );

    case "tabela":
      return (
        /* a tabela rola dentro da própria caixa — a página nunca rola de lado */
        <div style={{ overflowX: "auto", margin: "0 0 18px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, minWidth: 460 }}>
            <thead>
              <tr>
                {bloco.colunas.map((c, i) => (
                  <th
                    key={i}
                    style={{
                      textAlign: "left",
                      padding: "10px 10px",
                      borderBottom: `2px solid ${C.gold}`,
                      fontFamily: FONT_ELITE,
                      fontSize: 11,
                      letterSpacing: 1.6,
                      textTransform: "uppercase",
                      color: C.gold,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bloco.linhas.map((linha, i) => (
                <tr key={i}>
                  {linha.map((celula, j) => (
                    <td
                      key={j}
                      style={{
                        padding: "10px 10px",
                        borderBottom: "2px solid rgba(255,203,5,.14)",
                        verticalAlign: "top",
                        lineHeight: 1.6,
                      }}
                    >
                      {celula}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
};
