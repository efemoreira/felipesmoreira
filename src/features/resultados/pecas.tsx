"use client";
import React, { useMemo, useState } from "react";
import { C, FONT_DADOS, PAINEL_DADOS as P, RAIO_DADOS, fileteDados } from "@/lib/theme";
import { compacto, num, pct, UF_NOMES } from "./formato";
import type { Linha } from "./dados";
import { EXPLICACOES, type IdExplicacao } from "./explicacoes";

/*
 * As peças de /resultados, na superfície de dados (`PAINEL_DADOS`): fundo
 * claro, filete de 1 px, fonte do sistema com algarismos tabulares. A ordem
 * de leitura é sempre a mesma — rótulo pequeno em cima, número grande, uma
 * linha de contexto embaixo — e o ouro só marca o que é do Missão.
 */

/* ===== Texto e blocos ===== */

/** Rótulo pequeno acima de um número ou de um campo. */
export const kicker: React.CSSProperties = {
  fontFamily: FONT_DADOS,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: 0.4,
  textTransform: "uppercase",
  margin: "0 0 4px",
  color: P.tintaSuave,
};

export const cartao: React.CSSProperties = {
  background: P.superficie,
  border: fileteDados(),
  borderRadius: RAIO_DADOS,
};

export function Secao({ titulo, sub, explica, children }: { titulo: string; sub?: React.ReactNode; explica?: IdExplicacao; children: React.ReactNode }) {
  return (
    <section style={{ margin: "28px 0 0", paddingTop: 20, borderTop: fileteDados() }}>
      <h2 style={{ fontFamily: FONT_DADOS, fontSize: "clamp(18px, 4vw, 21px)", fontWeight: 700, lineHeight: 1.25, margin: "0 0 4px", color: P.tinta }}>{titulo}</h2>
      {sub && <p style={{ fontSize: 14, lineHeight: 1.5, margin: "0 0 6px", color: P.tintaSuave, maxWidth: "72ch" }}>{sub}</p>}
      {explica && <Explica id={explica} />}
      <div style={{ marginTop: sub || explica ? 6 : 10 }}>{children}</div>
    </section>
  );
}

/** "Sobre este dado": de onde vem, o que mede, por que importa e o cuidado — fechado até alguém abrir. */
export function Explica({ id }: { id: IdExplicacao }) {
  const e: { deOnde: string; mede: string; importa: string; cuidado?: string } = EXPLICACOES[id];
  const linhas: [string, string | undefined][] = [
    ["O que mede", e.mede],
    ["Por que importa", e.importa],
    ["Cuidado", e.cuidado],
    ["De onde vem", e.deOnde],
  ];
  return (
    <details style={{ margin: "0 0 6px", maxWidth: "75ch" }}>
      <summary style={{ cursor: "pointer", minHeight: 44, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: P.tinta }}>
        <span aria-hidden="true" style={{ display: "inline-grid", placeItems: "center", width: 18, height: 18, border: fileteDados(P.linhaForte), borderRadius: "50%", fontSize: 11 }}>
          ?
        </span>
        Sobre este dado
      </summary>
      <dl style={{ ...cartao, fontSize: 14, background: P.fundo, padding: "10px 14px", margin: "4px 0 6px", display: "grid", gap: 8 }}>
        {linhas
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt style={{ ...kicker, margin: 0 }}>{k}</dt>
              <dd style={{ margin: "2px 0 0", lineHeight: 1.5, color: P.tinta }}>{v}</dd>
            </div>
          ))}
      </dl>
    </details>
  );
}

export function Nota({ children }: { children: React.ReactNode }) {
  return <div style={{ ...cartao, fontSize: 14, lineHeight: 1.5, background: P.fundo, padding: "12px 14px", margin: "12px 0", color: P.tinta }}>{children}</div>;
}

export function Carregando({ erro }: { erro?: string | null }) {
  return (
    <p style={{ fontSize: 15, padding: "30px 0", color: erro ? C.erroTinta : P.tintaSuave }} role={erro ? "alert" : undefined}>
      {erro ? `Não consegui carregar os dados (${erro}). Recarregue a página.` : "Carregando dados…"}
    </p>
  );
}

/* ===== Indicadores ===== */

export type Kpi = { rotulo: string; valor: string; sub?: React.ReactNode; missao?: boolean };

/** Cartões de número: rótulo, número e contexto. O do Missão leva o filete de ouro à esquerda. */
export function Kpis({ itens }: { itens: Kpi[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, margin: "8px 0 6px" }}>
      {itens.map((k) => (
        <div
          key={k.rotulo}
          style={{
            ...cartao,
            background: k.missao ? P.realce : P.superficie,
            borderLeft: k.missao ? `4px solid ${P.missao}` : fileteDados(),
            padding: "10px 12px 11px",
            minWidth: 0,
          }}
        >
          <p style={{ ...kicker, margin: 0 }}>{k.rotulo}</p>
          <p
            style={{
              fontFamily: FONT_DADOS,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              fontSize: k.valor.length > 10 ? "clamp(16px, 4vw, 19px)" : "clamp(20px, 5vw, 24px)",
              lineHeight: 1.2,
              margin: "4px 0 0",
              color: P.tinta,
              overflowWrap: "anywhere",
            }}
          >
            {k.valor}
          </p>
          {k.sub && <p style={{ fontSize: 13, lineHeight: 1.4, margin: "4px 0 0", color: P.tintaSuave }}>{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/* ===== Controles ===== */

export const campo: React.CSSProperties = {
  fontFamily: FONT_DADOS,
  fontSize: 16, // 16 px: abaixo disso o Safari dá zoom no campo
  minHeight: 44,
  padding: "8px 10px",
  background: P.superficie,
  color: P.tinta,
  border: fileteDados(P.linhaForte),
  borderRadius: RAIO_DADOS,
  width: "100%",
};

export function Escolha<T extends string>({
  rotulo,
  valor,
  opcoes,
  aoMudar,
  nome = (v) => v,
}: {
  rotulo: string;
  valor: T;
  opcoes: T[];
  aoMudar: (v: T) => void;
  nome?: (v: T) => string;
}) {
  return (
    <label style={{ display: "block", flex: "1 1 220px", minWidth: 0 }}>
      <span style={{ ...kicker, display: "block" }}>{rotulo}</span>
      <select value={valor} onChange={(e) => aoMudar(e.target.value as T)} style={campo}>
        {opcoes.map((o) => (
          <option key={o} value={o}>
            {nome(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Busca({ rotulo, valor, aoMudar, dica }: { rotulo: string; valor: string; aoMudar: (v: string) => void; dica?: string }) {
  return (
    <label style={{ display: "block", flex: "1 1 220px", minWidth: 0 }}>
      <span style={{ ...kicker, display: "block" }}>{rotulo}</span>
      <input type="search" value={valor} placeholder={dica} onChange={(e) => aoMudar(e.target.value)} style={campo} />
    </label>
  );
}

/** Botões de opção única (o "segmented control"): o escolhido fica escuro. */
export function Chips<T extends string>({
  valor,
  opcoes,
  aoMudar,
  nome = (v) => v,
  desligado,
}: {
  valor: T;
  opcoes: T[];
  aoMudar: (v: T) => void;
  nome?: (v: T) => string;
  /** opção que não vale aqui: aparece apagada, com o motivo no `title` */
  desligado?: (v: T) => string | false;
}) {
  return (
    <div role="radiogroup" style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0 10px" }}>
      {opcoes.map((o) => {
        const ativo = o === valor;
        const motivo = desligado?.(o) || "";
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={ativo}
            aria-disabled={motivo ? true : undefined}
            title={motivo || undefined}
            onClick={() => !motivo && aoMudar(o)}
            style={{
              fontFamily: FONT_DADOS,
              fontWeight: 600,
              fontSize: 14,
              minHeight: 44,
              padding: "6px 14px",
              cursor: motivo ? "not-allowed" : "pointer",
              color: ativo ? P.superficie : P.tinta,
              background: ativo ? P.tinta : P.superficie,
              border: fileteDados(ativo ? P.tinta : P.linhaForte),
              borderRadius: 999,
              opacity: motivo ? 0.45 : 1,
              whiteSpace: "nowrap",
            }}
          >
            {nome(o)}
          </button>
        );
      })}
    </div>
  );
}

export function Filtros({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "6px 0 12px" }}>{children}</div>;
}

/** Legenda de cores dos gráficos — identidade nunca só pela cor: cada barra também tem rótulo. */
export function Legenda({ itens, extra }: { itens: [string, string][]; extra?: string }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13.5, margin: "6px 0 10px", color: P.tinta }}>
      {itens.map(([cor, nome]) => (
        <span key={nome} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden="true" style={{ width: 12, height: 12, background: cor, borderRadius: 3 }} />
          {nome}
        </span>
      ))}
      {extra && <span style={{ color: P.tintaSuave }}>{extra}</span>}
    </div>
  );
}

/* ===== Tabela ordenável ===== */

export type Coluna = {
  chave: string;
  rotulo: string;
  tipo?: "int" | "pct" | "txt" | "dec" | "barra" | "compacto";
  /** barra: valor que enche a barra (padrão 1 = 100%) */
  max?: number;
  ajuda?: string;
  valor?: (l: Linha) => number | string;
};

/** CSV que o Excel em português abre direto: `;` como separador, vírgula decimal e BOM para o acento. */
function baixarCsv(linhas: Linha[], colunas: Coluna[], nome: string) {
  const campoCsv = (v: unknown) => {
    if (v === undefined || v === null || (typeof v === "number" && !Number.isFinite(v))) return "";
    const s = typeof v === "number" ? String(v).replace(".", ",") : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const corpo = [colunas.map((c) => campoCsv(c.rotulo)).join(";"), ...linhas.map((l) => colunas.map((c) => campoCsv(c.valor ? c.valor(l) : l[c.chave])).join(";"))];
  const url = URL.createObjectURL(new Blob(["﻿" + corpo.join("\r\n")], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nome}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Tabela({
  linhas,
  colunas,
  ordem: ordemInicial,
  teto = 150,
  arquivo,
  aoEscolher,
}: {
  linhas: Linha[];
  colunas: Coluna[];
  ordem?: string;
  teto?: number;
  /** nome do CSV ("bairros-fortaleza"); sem ele, a tabela não oferece download */
  arquivo?: string;
  /** a linha vira botão (o Explorador desce no lugar) */
  aoEscolher?: (l: Linha) => void;
}) {
  const [ordem, setOrdem] = useState<{ chave: string; desc: boolean }>({ chave: ordemInicial ?? colunas[0].chave, desc: true });
  const [mostrar, setMostrar] = useState(teto);
  const valorDe = (l: Linha, c: Coluna) => (c.valor ? c.valor(l) : l[c.chave]);

  const ordenadas = useMemo(() => {
    const col = colunas.find((c) => c.chave === ordem.chave) ?? colunas[0];
    const v = (l: Linha) => (col.valor ? col.valor(l) : l[col.chave]);
    return [...linhas].sort((a, b) => {
      const x = v(a);
      const y = v(b);
      if (x === undefined || (typeof x === "number" && Number.isNaN(x))) return 1;
      if (y === undefined || (typeof y === "number" && Number.isNaN(y))) return -1;
      const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), "pt-BR");
      return ordem.desc ? -r : r;
    });
  }, [linhas, colunas, ordem]);

  const celula = (l: Linha, c: Coluna) => {
    const v = valorDe(l, c);
    if (v === undefined || v === null || v === "") return "—";
    if (typeof v !== "number") return String(v);
    switch (c.tipo) {
      case "pct":
        return pct(v);
      case "dec":
        return num(v, 2);
      case "compacto":
        return compacto(v);
      case "barra": {
        const w = Math.max(0, Math.min(1, v / (c.max ?? 1)));
        return (
          <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 110 }}>
            <span style={{ flex: 1, height: 8, background: P.fundo, borderRadius: 4, overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", width: `${w * 100}%`, background: P.missao }} />
            </span>
            <span style={{ minWidth: 48, textAlign: "right" }}>{(c.max ?? 1) > 1.01 ? num(v, 2) : pct(v)}</span>
          </span>
        );
      }
      default:
        return num(v);
    }
  };

  return (
    <div>
      <div style={{ ...cartao, overflow: "auto", maxHeight: 560 }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%", fontSize: 14, fontFamily: FONT_DADOS, color: P.tinta }}>
          <thead>
            <tr>
              {colunas.map((c, i) => {
                const ativa = ordem.chave === c.chave;
                return (
                  <th
                    key={c.chave}
                    title={c.ajuda}
                    aria-sort={ativa ? (ordem.desc ? "descending" : "ascending") : undefined}
                    style={{
                      position: "sticky",
                      top: 0,
                      left: i === 0 ? 0 : undefined,
                      zIndex: i === 0 ? 3 : 2,
                      background: P.fundo,
                      borderBottom: fileteDados(P.linhaForte),
                      padding: 0,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setOrdem((o) => ({ chave: c.chave, desc: o.chave === c.chave ? !o.desc : true }))}
                      style={{
                        all: "unset",
                        boxSizing: "border-box",
                        display: "block",
                        width: "100%",
                        cursor: "pointer",
                        padding: "10px 10px",
                        minHeight: 40,
                        fontSize: 12,
                        fontWeight: 700,
                        color: ativa ? P.tinta : P.tintaSuave,
                        textAlign: c.tipo === "txt" ? "left" : "right",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {c.rotulo}
                      {ativa ? (ordem.desc ? " ↓" : " ↑") : ""}
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {ordenadas.slice(0, mostrar).map((l, r) => (
              <tr
                key={r}
                onClick={aoEscolher ? () => aoEscolher(l) : undefined}
                style={{ cursor: aoEscolher ? "pointer" : undefined }}
                className={aoEscolher ? "linha-escolhe" : undefined}
              >
                {colunas.map((c, i) => (
                  <td
                    key={c.chave}
                    style={{
                      position: i === 0 ? "sticky" : undefined,
                      left: i === 0 ? 0 : undefined,
                      background: P.superficie,
                      textAlign: c.tipo === "txt" ? "left" : "right",
                      padding: "8px 10px",
                      borderBottom: fileteDados(),
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: i === 0 ? 600 : 400,
                      textDecoration: i === 0 && aoEscolher ? "underline" : undefined,
                      textUnderlineOffset: 3,
                    }}
                  >
                    {celula(l, c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 13, margin: "4px 0 0", color: P.tintaSuave }}>
        {num(ordenadas.length)} linhas · toque no título da coluna para ordenar
        {ordenadas.length > mostrar && (
          <>
            {" · "}
            <button type="button" onClick={() => setMostrar((m) => m + 300)} style={linkBotao}>
              mostrar mais
            </button>
          </>
        )}
        {arquivo && ordenadas.length > 0 && (
          <>
            {" · "}
            <button type="button" onClick={() => baixarCsv(ordenadas, colunas, arquivo)} style={linkBotao}>
              baixar CSV (Excel)
            </button>
          </>
        )}
      </p>
    </div>
  );
}

export const linkBotao: React.CSSProperties = {
  font: "inherit",
  textDecoration: "underline",
  textUnderlineOffset: 3,
  background: "none",
  border: 0,
  cursor: "pointer",
  color: P.tinta,
  padding: "10px 0",
  minHeight: 44,
};

/** O estado escolhido vale para todas as abas (o pai guarda). */
export function SeletorUf({ uf, opcoes, aoMudar }: { uf: string; opcoes: string[]; aoMudar: (u: string) => void }) {
  return <Escolha rotulo="Estado" valor={uf} opcoes={opcoes} aoMudar={aoMudar} nome={(u) => UF_NOMES[u] ?? u.toUpperCase()} />;
}
