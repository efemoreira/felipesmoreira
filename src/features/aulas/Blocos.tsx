"use client";
import React from "react";
import { C, RAIO, borda } from "@/lib/theme";
import type { Bloco } from "./tipos";

/**
 * Desenha os blocos de conteúdo de uma aula. Os tipos são fechados
 * (ver tipos.ts) e vêm prontos do painel — o site não decide conteúdo, só
 * apresentação.
 */

const MONO = "ui-monospace, SFMono-Regular, Menlo, monospace";

/* o rótulo de uma seção da aula */
const Rotulo: React.FC<{ children: React.ReactNode; cor?: string }> = ({ children, cor = C.goldDim }) => (
  <p
    style={{
      fontWeight: 600,
      fontSize: 14.5,
      color: cor,
      margin: "0 0 8px",
    }}
  >
    {children}
  </p>
);

/* a caixa de um bloco: linha fina e canto redondo, como os cartões do site */
const Caixa: React.FC<{ cor: string; fundo?: string; children: React.ReactNode }> = ({
  cor,
  fundo = C.paper,
  children,
}) => (
  <div
    style={{
      border: borda(cor),
      borderRadius: RAIO.m,
      background: fundo,
      padding: "14px 16px",
      margin: "0 0 18px",
    }}
  >
    {children}
  </div>
);

const marcador = { color: C.goldDim, flex: "0 0 auto" } as const;
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
                  fontWeight: 800,
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
        <Caixa cor={C.linha}>
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
        <Caixa cor={C.erroBorda} fundo={C.erroFundo}>
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
        <Caixa cor={C.linha} fundo={C.fundo}>
          <Rotulo>{bloco.titulo}</Rotulo>
          {/* pre para o alinhamento do modelo sobreviver; rola sozinho no celular */}
          <pre
            style={{
              margin: 0,
              fontFamily: MONO,
              fontSize: 14.5,
              lineHeight: 1.8,
              color: C.ink,
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
        <Caixa cor={C.gold} fundo={C.ouroClaro}>
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
                      borderBottom: borda(),
                      fontWeight: 600,
                      fontSize: 14.5,
                      color: C.goldDim,
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
                        borderBottom: borda(),
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
