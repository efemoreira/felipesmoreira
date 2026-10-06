"use client";
import React, { useMemo, useState } from "react";
import { C, FONT_ALFA, FONT_BITTER, FONT_ELITE, TEXTO, borda, bordaFina, sombra } from "@/lib/theme";
import { compacto, num, pct, UF_NOMES } from "./formato";
import type { Linha } from "./dados";
import { EXPLICACOES, type IdExplicacao } from "./explicacoes";

/* ===== Texto e blocos ===== */

export const kicker: React.CSSProperties = {
  fontFamily: FONT_ELITE,
  fontSize: 12,
  letterSpacing: 2.5,
  textTransform: "uppercase",
  margin: "0 0 6px",
  color: C.goldDim,
};

export function Secao({ titulo, sub, explica, children }: { titulo: string; sub?: React.ReactNode; explica?: IdExplicacao; children: React.ReactNode }) {
  return (
    <section style={{ margin: "34px 0 0" }}>
      <h2 style={{ fontFamily: FONT_ALFA, fontSize: "clamp(20px, 4.6vw, 26px)", lineHeight: 1.15, margin: "0 0 6px", color: C.ink }}>
        {titulo}
      </h2>
      {sub && <p style={{ ...TEXTO.nota, margin: "0 0 8px", color: C.ink, opacity: 0.78, maxWidth: "70ch" }}>{sub}</p>}
      {explica && <Explica id={explica} />}
      <div style={{ marginTop: sub || explica ? 6 : 0 }}>{children}</div>
    </section>
  );
}

/** "Sobre este dado": de onde vem, o que mede, por que importa e o cuidado — fechado até alguém abrir. */
export function Explica({ id }: { id: IdExplicacao }) {
  const e: { deOnde: string; mede: string; importa: string; cuidado?: string } = EXPLICACOES[id];
  const linhas: [string, string | undefined][] = [
    ["De onde vem", e.deOnde],
    ["O que mede", e.mede],
    ["Por que importa", e.importa],
    ["Cuidado", e.cuidado],
  ];
  return (
    <details style={{ margin: "0 0 8px", maxWidth: "75ch" }}>
      <summary style={{ cursor: "pointer", minHeight: 44, display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: C.ink }}>
        <span aria-hidden="true" style={{ display: "inline-grid", placeItems: "center", width: 20, height: 20, border: bordaFina(C.ink), borderRadius: "50%", fontSize: 12, fontFamily: FONT_ELITE }}>
          ?
        </span>
        Sobre este dado
      </summary>
      <dl style={{ ...TEXTO.nota, background: C.cream, border: bordaFina(C.ink), padding: "10px 14px", margin: "4px 0 6px", display: "grid", gap: 8 }}>
        {linhas
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt style={{ fontFamily: FONT_ELITE, fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase" }}>{k}</dt>
              <dd style={{ margin: "2px 0 0", lineHeight: 1.5 }}>{v}</dd>
            </div>
          ))}
      </dl>
    </details>
  );
}

export function Nota({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...TEXTO.nota, background: C.cream, border: bordaFina(C.ink), padding: "12px 14px", margin: "12px 0" }}>
      {children}
    </div>
  );
}

export function Carregando({ erro }: { erro?: string | null }) {
  return (
    <p style={{ ...TEXTO.corpo, padding: "30px 0", color: erro ? C.erroTinta : C.ink, opacity: erro ? 1 : 0.7 }}>
      {erro ? `Não consegui carregar os dados (${erro}). Recarregue a página.` : "Carregando dados…"}
    </p>
  );
}

/* ===== Indicadores ===== */

export type Kpi = { rotulo: string; valor: string; sub?: React.ReactNode; missao?: boolean };

export function Kpis({ itens }: { itens: Kpi[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, margin: "10px 0 6px" }}>
      {itens.map((k) => (
        <div
          key={k.rotulo}
          style={{
            background: k.missao ? C.gold2 : C.cream,
            border: borda(C.ink),
            boxShadow: sombra("rente"),
            padding: "10px 12px 11px",
            minWidth: 0,
          }}
        >
          <p style={{ fontFamily: FONT_ELITE, fontSize: 11.5, letterSpacing: 1.2, textTransform: "uppercase", margin: 0, color: C.ink }}>
            {k.rotulo}
          </p>
          <p style={{ fontFamily: FONT_ALFA, fontSize: k.valor.length > 8 ? "clamp(17px, 4.2vw, 21px)" : "clamp(20px, 5vw, 25px)", lineHeight: 1.2, margin: "4px 0 0", color: C.ink, overflowWrap: "anywhere" }}>
            {k.valor}
          </p>
          {k.sub && <p style={{ fontSize: 13, lineHeight: 1.4, margin: "4px 0 0", color: C.ink, opacity: 0.8 }}>{k.sub}</p>}
        </div>
      ))}
    </div>
  );
}

/* ===== Controles ===== */

const campo: React.CSSProperties = {
  fontFamily: FONT_BITTER,
  fontSize: 16, // 16 px: abaixo disso o Safari dá zoom no campo
  minHeight: 44,
  padding: "8px 10px",
  background: C.cream,
  color: C.ink,
  border: borda(C.ink),
  borderRadius: 0,
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
      <span style={{ ...kicker, display: "block", color: C.ink }}>{rotulo}</span>
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
      <span style={{ ...kicker, display: "block", color: C.ink }}>{rotulo}</span>
      <input type="search" value={valor} placeholder={dica} onChange={(e) => aoMudar(e.target.value)} style={campo} />
    </label>
  );
}

/** Botões de opção única (o "segmented control"). */
export function Chips<T extends string>({ valor, opcoes, aoMudar, nome = (v) => v }: { valor: T; opcoes: T[]; aoMudar: (v: T) => void; nome?: (v: T) => string }) {
  return (
    <div role="radiogroup" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "8px 0 12px" }}>
      {opcoes.map((o) => {
        const ativo = o === valor;
        return (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={ativo}
            onClick={() => aoMudar(o)}
            style={{
              fontFamily: FONT_BITTER,
              fontWeight: 600,
              fontSize: 14.5,
              minHeight: 44,
              padding: "6px 12px",
              cursor: "pointer",
              color: C.ink,
              background: ativo ? C.gold : C.cream,
              border: borda(C.ink),
              boxShadow: ativo ? "none" : sombra("rente"),
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
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 13.5, margin: "6px 0 10px", color: C.ink }}>
      {itens.map(([cor, nome]) => (
        <span key={nome} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span aria-hidden="true" style={{ width: 13, height: 13, background: cor, border: bordaFina(C.ink) }} />
          {nome}
        </span>
      ))}
      {extra && <span style={{ opacity: 0.75 }}>{extra}</span>}
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
  const campo = (v: unknown) => {
    if (v === undefined || v === null || (typeof v === "number" && !Number.isFinite(v))) return "";
    const s = typeof v === "number" ? String(v).replace(".", ",") : String(v);
    return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const corpo = [colunas.map((c) => campo(c.rotulo)).join(";"), ...linhas.map((l) => colunas.map((c) => campo(c.valor ? c.valor(l) : l[c.chave])).join(";"))];
  const url = URL.createObjectURL(new Blob(["\ufeff" + corpo.join("\r\n")], { type: "text/csv;charset=utf-8" }));
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
}: {
  linhas: Linha[];
  colunas: Coluna[];
  ordem?: string;
  teto?: number;
  /** nome do CSV ("bairros-fortaleza"); sem ele, a tabela não oferece download */
  arquivo?: string;
}) {
  const [ordem, setOrdem] = useState<{ chave: string; desc: boolean }>({ chave: ordemInicial ?? colunas[0].chave, desc: true });
  const [mostrar, setMostrar] = useState(teto);
  const valorDe = (l: Linha, c: Coluna) => (c.valor ? c.valor(l) : l[c.chave]);

  const ordenadas = useMemo(() => {
    const col = colunas.find((c) => c.chave === ordem.chave) ?? colunas[0];
    return [...linhas].sort((a, b) => {
      const x = valorDe(a, col);
      const y = valorDe(b, col);
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
            <span style={{ flex: 1, height: 10, background: C.paper, border: bordaFina(C.ink) }}>
              <span style={{ display: "block", height: "100%", width: `${w * 100}%`, background: C.goldDim }} />
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
      <div style={{ overflow: "auto", maxHeight: 560, border: borda(C.ink), background: C.cream }}>
        <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 14 }}>
          <thead>
            <tr>
              {colunas.map((c, i) => (
                <th
                  key={c.chave}
                  title={c.ajuda}
                  onClick={() => setOrdem((o) => ({ chave: c.chave, desc: o.chave === c.chave ? !o.desc : true }))}
                  style={{
                    position: "sticky",
                    top: 0,
                    left: i === 0 ? 0 : undefined,
                    zIndex: i === 0 ? 3 : 2,
                    background: C.ink,
                    color: C.cream,
                    fontFamily: FONT_ELITE,
                    fontWeight: 400,
                    fontSize: 12,
                    letterSpacing: 0.6,
                    textAlign: c.tipo === "txt" ? "left" : "right",
                    padding: "9px 8px",
                    whiteSpace: "nowrap",
                    cursor: "pointer",
                  }}
                >
                  {c.rotulo}
                  {ordem.chave === c.chave ? (ordem.desc ? " ▾" : " ▴") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenadas.slice(0, mostrar).map((l, r) => (
              <tr key={r} style={{ background: r % 2 ? C.paper : C.cream }}>
                {colunas.map((c, i) => (
                  <td
                    key={c.chave}
                    style={{
                      position: i === 0 ? "sticky" : undefined,
                      left: i === 0 ? 0 : undefined,
                      background: i === 0 ? (r % 2 ? C.paper : C.cream) : undefined,
                      textAlign: c.tipo === "txt" ? "left" : "right",
                      padding: "7px 8px",
                      borderTop: `1px solid rgba(24,18,3,.12)`,
                      whiteSpace: "nowrap",
                      fontVariantNumeric: "tabular-nums",
                      fontWeight: i === 0 ? 600 : 400,
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
      <p style={{ fontSize: 13, margin: "6px 0 0", opacity: 0.75 }}>
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

const linkBotao: React.CSSProperties = { font: "inherit", textDecoration: "underline", background: "none", border: 0, cursor: "pointer", color: C.ink, padding: "10px 0", minHeight: 44 };

/** O estado escolhido vale para todas as abas (o pai guarda). */
export function SeletorUf({ uf, opcoes, aoMudar }: { uf: string; opcoes: string[]; aoMudar: (u: string) => void }) {
  return <Escolha rotulo="Estado" valor={uf} opcoes={opcoes} aoMudar={aoMudar} nome={(u) => UF_NOMES[u] ?? u.toUpperCase()} />;
}
