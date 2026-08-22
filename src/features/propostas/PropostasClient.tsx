"use client";
import React, { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER } from "@/lib/theme";
import {
  CHAPA,
  CITACOES,
  METODO_FRASE,
  PRINCIPIOS,
  SEIS_PERGUNTAS,
  TESE,
  compromissos,
} from "./data";
import { FaixaEleicao } from "@/components/FaixaEleicao";
import type { Compromisso } from "./tipos";

/* Hachura de xilogravura sobre o papel — mesma textura de /plano e /herois. */
const HATCH =
  "repeating-linear-gradient(88deg, rgba(24,18,3,.045) 0 2px, transparent 2px 15px)," +
  "repeating-linear-gradient(-91deg, rgba(24,18,3,.03) 0 2px, transparent 2px 21px)";

/* Curto de propósito: com o intervalo de páginas ao lado, um rótulo mais longo
   quebra em duas linhas a 390px e desalinha o número do título. */
const MOVIMENTO_ROTULO: Record<Compromisso["movimento"], string> = {
  retomar: "Retomar",
  reconstruir: "Reconstruir",
  metodo: "Método",
};

/* ===================== peças ===================== */

const Selo: React.FC<{ n: number }> = ({ n }) => (
  <span
    aria-hidden="true"
    style={{
      flex: "0 0 auto",
      width: 40,
      height: 40,
      display: "grid",
      placeItems: "center",
      background: C.ink,
      color: C.gold,
      border: `3px solid ${C.ink}`,
      fontFamily: FONT_ALFA,
      fontSize: 18,
      lineHeight: 1,
    }}
  >
    {n}
  </span>
);

/** O número que se cobra. Tabular para as colunas não dançarem. */
const CartaoMeta: React.FC<{ numero: string; oQue: string; pagina: string }> = ({
  numero,
  oQue,
  pagina,
}) => (
  <div
    style={{
      background: C.cream,
      border: `3px solid ${C.ink}`,
      boxShadow: "4px 4px 0 rgba(24,18,3,.3)",
      padding: "12px 14px",
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}
  >
    <b
      style={{
        fontFamily: FONT_ALFA,
        fontSize: "clamp(19px, 4.4vw, 24px)",
        lineHeight: 1.05,
        fontWeight: 400,
        fontVariantNumeric: "tabular-nums",
        color: C.ink,
      }}
    >
      {numero}
    </b>
    <span style={{ fontSize: 13.5, lineHeight: 1.4, color: C.ink }}>{oQue}</span>
    <span style={{ fontFamily: FONT_ELITE, fontSize: 11, letterSpacing: 1, opacity: 0.6 }}>
      {pagina}
    </span>
  </div>
);

const BlocoCompromisso: React.FC<{ c: Compromisso }> = ({ c }) => {
  const [aberto, setAberto] = useState(false);

  return (
    <article
      id={c.id}
      style={{
        background: C.paper,
        border: `3px solid ${C.ink}`,
        boxShadow: "7px 7px 0 rgba(24,18,3,.3)",
        padding: "22px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 18,
        scrollMarginTop: 20,
      }}
    >
      <header style={{ display: "flex", alignItems: "center", gap: 13 }}>
        <Selo n={c.numero} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              fontFamily: FONT_ELITE,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: 0.7,
              margin: "0 0 3px",
            }}
          >
            {MOVIMENTO_ROTULO[c.movimento]} · {c.paginas}
          </p>
          <h2
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(20px, 5vw, 27px)",
              lineHeight: 1.1,
              letterSpacing: 0.3,
              margin: 0,
              textWrap: "balance",
            }}
          >
            {c.titulo}
          </h2>
        </div>
        <span
          aria-hidden="true"
          style={{
            flex: "0 0 auto",
            width: 42,
            height: 42,
            display: "grid",
            placeItems: "center",
            background: C.gold,
            border: `3px solid ${C.ink}`,
            color: C.ink,
          }}
        >
          <Icon name={c.icone} size={22} />
        </span>
      </header>

      {/* O que está em jogo */}
      <div>
        <p style={rotuloSecao}>O que está em jogo</p>
        <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.6 }}>{c.emJogo}</p>
      </div>

      {/* Onde queremos chegar — os números */}
      <div>
        <p style={rotuloSecao}>Onde queremos chegar</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 10,
          }}
        >
          {c.metas.map((m) => (
            <CartaoMeta key={m.oQue} {...m} />
          ))}
        </div>
      </div>

      {/* O que vamos fazer */}
      <div>
        <p style={rotuloSecao}>O que vamos fazer</p>
        <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 14 }}>
          {c.propostas.map((p) => (
            <li key={p.titulo} style={{ borderLeft: `4px solid ${C.gold}`, paddingLeft: 13 }}>
              <b style={{ display: "block", fontSize: 15.5, lineHeight: 1.3, marginBottom: 3 }}>
                {p.titulo}{" "}
                <span style={{ fontFamily: FONT_ELITE, fontSize: 11, letterSpacing: 1, opacity: 0.55, fontWeight: 400 }}>
                  {p.pagina}
                </span>
              </b>
              <span style={{ display: "block", fontSize: 15, lineHeight: 1.6 }}>{p.texto}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Recurso e prazo ficam recolhidos: com 8 compromissos abertos de uma vez,
          a página vira um paredão. Mesma razão do <details> das inscrições. */}
      <details
        open={aberto}
        onToggle={(e) => setAberto((e.currentTarget as HTMLDetailsElement).open)}
        style={{ borderTop: `2px solid rgba(24,18,3,.2)`, paddingTop: 14 }}
      >
        <summary
          style={{
            cursor: "pointer",
            listStyle: "none",
            fontFamily: FONT_ELITE,
            fontSize: 12.5,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: C.ink,
            color: C.gold,
            padding: "8px 14px",
            minHeight: 44,
            boxSizing: "border-box",
          }}
        >
          <Icon name={aberto ? "close" : "search"} size={15} />
          {aberto ? "Fechar" : "De onde vem o recurso e quando entrega"}
        </summary>

        <div style={{ paddingTop: 16, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <p style={rotuloSecao}>De onde vem o recurso</p>
            <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc", display: "flex", flexDirection: "column", gap: 7 }}>
              {c.recurso.map((r) => (
                <li key={r} style={{ fontSize: 14.5, lineHeight: 1.55 }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p style={rotuloSecao}>Quando entrega</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {c.prazos.map((p) => (
                <div key={p.quando} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                  <span
                    style={{
                      flex: "0 0 auto",
                      minWidth: 82,
                      textAlign: "center",
                      fontFamily: FONT_ELITE,
                      fontSize: 11,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      background: C.gold,
                      color: C.ink,
                      border: `2px solid ${C.ink}`,
                      padding: "3px 8px",
                    }}
                  >
                    {p.quando}
                  </span>
                  <span style={{ fontSize: 14.5, lineHeight: 1.5 }}>{p.entrega}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </details>
    </article>
  );
};

const rotuloSecao: React.CSSProperties = {
  fontFamily: FONT_ELITE,
  fontSize: 11.5,
  letterSpacing: 2.2,
  textTransform: "uppercase",
  opacity: 0.65,
  margin: "0 0 8px",
};

/* ===================== página ===================== */

export default function PropostasClient() {
  return (
    <div
      style={{
        /* O layout declara `color-scheme: dark`. Sem trocar aqui, o navegador
           desenha caixa de seleção e foco em tema escuro sobre o papel claro. */
        colorScheme: "light",
        background: `${HATCH}, ${C.paper}`,
        color: C.ink,
        fontFamily: FONT_BITTER,
        minHeight: "100dvh",
        overflowX: "clip",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "26px 20px 90px" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            minHeight: 44,
            fontFamily: FONT_ELITE,
            fontSize: 12.5,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            color: C.ink,
            textDecoration: "none",
          }}
        >
          <Icon name="arrowLeft" size={17} />
          Voltar
        </Link>

        {/* ===== abertura ===== */}
        <header style={{ margin: "16px 0 34px" }}>
          <p
            style={{
              display: "inline-block",
              fontFamily: FONT_ELITE,
              letterSpacing: 3,
              fontSize: 11.5,
              textTransform: "uppercase",
              color: C.ink,
              background: C.gold,
              border: `2px solid ${C.ink}`,
              padding: "4px 12px",
              margin: "0 0 14px",
            }}
          >
            Plano de governo · {CHAPA.paginas} páginas
          </p>
          <h1
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(32px, 8.5vw, 52px)",
              lineHeight: 1.02,
              letterSpacing: 0.5,
              margin: "0 0 14px",
              textShadow: `3px 3px 0 ${C.gold}`,
              textWrap: "balance",
            }}
          >
            {CHAPA.documento}
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.55, margin: "0 0 16px", maxWidth: "60ch" }}>
            {TESE}
          </p>
          <p
            style={{
              fontFamily: FONT_ELITE,
              fontSize: 13,
              letterSpacing: 0.5,
              lineHeight: 1.6,
              margin: 0,
              paddingTop: 14,
              borderTop: `3px solid ${C.ink}`,
            }}
          >
            <strong>{CHAPA.governador}</strong>, governador · <strong>{CHAPA.vice}</strong>, vice
            <br />
            Partido {CHAPA.partido} — Governo do Ceará
          </p>
        </header>

        {/* ===== como ler ===== */}
        <section
          style={{
            background: C.ink,
            color: C.cream,
            border: `3px solid ${C.ink}`,
            boxShadow: "7px 7px 0 rgba(24,18,3,.3)",
            padding: "22px 20px",
            marginBottom: 34,
          }}
        >
          <h2
            style={{
              fontFamily: FONT_ALFA,
              fontSize: 21,
              lineHeight: 1.15,
              color: C.gold,
              margin: "0 0 12px",
            }}
          >
            Como ler este plano
          </h2>
          <p style={{ margin: "0 0 16px", fontSize: 15.5, lineHeight: 1.6 }}>
            Ele não é organizado por secretaria, e sim por compromissos — porque os problemas do
            cearense não respeitam a divisão de pastas do governo. Cada um responde sempre às
            mesmas seis perguntas:
          </p>
          <ol
            style={{
              margin: "0 0 16px",
              padding: 0,
              listStyle: "none",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 8,
            }}
          >
            {SEIS_PERGUNTAS.map((p, i) => (
              <li
                key={p}
                style={{
                  fontFamily: FONT_ELITE,
                  fontSize: 12.5,
                  letterSpacing: 0.8,
                  display: "flex",
                  gap: 8,
                  alignItems: "baseline",
                }}
              >
                <b style={{ color: C.gold, fontWeight: 400 }}>{i + 1}.</b>
                {p}
              </li>
            ))}
          </ol>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, fontStyle: "italic", opacity: 0.9 }}>
            {METODO_FRASE}
          </p>
        </section>

        {/* ===== princípios ===== */}
        <section style={{ marginBottom: 34 }}>
          <p style={rotuloSecao}>Os cinco princípios</p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {PRINCIPIOS.map((p) => (
              <li
                key={p}
                style={{
                  fontFamily: FONT_ELITE,
                  fontSize: 12.5,
                  letterSpacing: 0.6,
                  background: C.cream,
                  border: `2px solid ${C.ink}`,
                  boxShadow: "3px 3px 0 rgba(24,18,3,.28)",
                  padding: "6px 11px",
                }}
              >
                {p}
              </li>
            ))}
          </ul>
        </section>

        {/* ===== sumário navegável ===== */}
        <nav aria-label="Os compromissos" style={{ marginBottom: 34 }}>
          <p style={rotuloSecao}>Os compromissos</p>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {compromissos.map((c) => (
              <li key={c.id}>
                <a
                  href={`#${c.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 11,
                    minHeight: 44,
                    padding: "6px 12px",
                    background: C.cream,
                    border: `2px solid ${C.ink}`,
                    color: C.ink,
                    textDecoration: "none",
                    fontSize: 15,
                  }}
                >
                  <b
                    style={{
                      fontFamily: FONT_ALFA,
                      fontWeight: 400,
                      fontSize: 15,
                      minWidth: 16,
                      textAlign: "center",
                    }}
                  >
                    {c.numero}
                  </b>
                  <span style={{ flex: 1 }}>{c.titulo}</span>
                  <Icon name="chevronRight" size={17} style={{ opacity: 0.5 }} />
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ===== os compromissos ===== */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          {compromissos.map((c) => (
            <BlocoCompromisso key={c.id} c={c} />
          ))}
        </div>

        {/* ===== a carta ===== */}
        <section style={{ marginTop: 40 }}>
          <p style={rotuloSecao}>Da carta ao povo cearense</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {CITACOES.map((q) => (
              <blockquote
                key={q.pagina + q.texto.slice(0, 20)}
                style={{
                  margin: 0,
                  borderLeft: `5px solid ${C.gold}`,
                  background: C.cream,
                  border: `3px solid ${C.ink}`,
                  borderLeftWidth: 7,
                  borderLeftColor: C.gold,
                  boxShadow: "5px 5px 0 rgba(24,18,3,.28)",
                  padding: "16px 18px",
                }}
              >
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, fontStyle: "italic" }}>
                  “{q.texto}”
                </p>
                <cite
                  style={{
                    display: "block",
                    marginTop: 8,
                    fontFamily: FONT_ELITE,
                    fontSize: 11.5,
                    letterSpacing: 1.4,
                    fontStyle: "normal",
                    opacity: 0.65,
                  }}
                >
                  {CHAPA.documento}, {q.pagina}
                </cite>
              </blockquote>
            ))}
          </div>
        </section>

        <div style={{ marginTop: 34 }}>
          <FaixaEleicao />
        </div>

        {/* ===== chamada ===== */}
        <section
          style={{
            marginTop: 34,
            background: C.gold,
            border: `3px solid ${C.ink}`,
            boxShadow: "7px 7px 0 rgba(24,18,3,.3)",
            padding: "22px 20px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontFamily: FONT_ALFA, fontSize: 23, lineHeight: 1.15, margin: "0 0 10px" }}>
            Cobrar é bom. Construir é melhor.
          </h2>
          <p style={{ margin: "0 0 18px", fontSize: 15.5, lineHeight: 1.6 }}>
            Este plano só sai do papel se tiver gente. Entre na militância da Missão Ceará e
            escolha por onde começar.
          </p>
          <Link
            href="/queroajudar"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              minHeight: 48,
              padding: "12px 22px",
              background: C.ink,
              color: C.gold,
              border: `3px solid ${C.ink}`,
              boxShadow: "4px 4px 0 rgba(24,18,3,.35)",
              fontFamily: FONT_ALFA,
              fontSize: 16,
              textDecoration: "none",
            }}
          >
            <Icon name="flag" size={19} />
            Quero ajudar
          </Link>
        </section>
      </div>

      <style>{`
        #${compromissos.map((c) => c.id).join(", #")} { scroll-margin-top: 20px; }
        summary::-webkit-details-marker { display: none; }
        a:focus-visible, summary:focus-visible {
          outline: 3px solid ${C.ink};
          outline-offset: 3px;
        }
      `}</style>
    </div>
  );
}
