import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { C, FONT_ALFA, FONT_ELITE, FONT_BITTER, borda, bordaFina, sombra, HATCH, TEXTO } from "@/lib/theme";

/**
 * A moldura das três páginas da organização — /nucleos, /temas, /portavozes.
 *
 * O mesmo papel hachurado de /funcoes, o mesmo "Voltar", o mesmo selo de
 * kicker: as quatro são a mesma conversa ("onde eu entro?") vista de lados
 * diferentes, e precisam parecer a mesma coisa.
 */

export const rotuloPequeno: React.CSSProperties = {
  fontFamily: FONT_ELITE,
  fontSize: 11.5,
  letterSpacing: 2.2,
  textTransform: "uppercase",
  opacity: 0.7,
  margin: "0 0 6px",
};

export const cartao: React.CSSProperties = {
  background: C.cream,
  border: borda(),
  boxShadow: sombra(),
  padding: "18px 16px",
  display: "flex",
  flexDirection: "column",
  gap: 12,
  minWidth: 0,
};

export function Moldura({
  kicker,
  titulo,
  children,
  intro,
}: {
  kicker: string;
  titulo: string;
  intro: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        colorScheme: "light",
        background: `${HATCH}, ${C.paper}`,
        color: C.ink,
        fontFamily: FONT_BITTER,
        minHeight: "100dvh",
        overflowX: "clip",
      }}
    >
      <div style={{ maxWidth: 820, margin: "0 auto", padding: "26px 16px 90px" }}>
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

        <header style={{ margin: "16px 0 30px" }}>
          <p
            style={{
              display: "inline-block",
              fontFamily: FONT_ELITE,
              letterSpacing: 3,
              fontSize: 11.5,
              textTransform: "uppercase",
              background: C.gold,
              border: bordaFina(C.ink),
              padding: "4px 12px",
              margin: "0 0 14px",
            }}
          >
            {kicker}
          </p>
          <h1
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(30px, 8vw, 46px)",
              lineHeight: 1.04,
              margin: "0 0 14px",
              textShadow: `3px 3px 0 ${C.gold}`,
              textWrap: "balance",
            }}
          >
            {titulo}
          </h1>
          <div style={{ fontSize: 17, lineHeight: 1.55, margin: 0, maxWidth: "60ch" }}>{intro}</div>
        </header>

        {children}

        <Convite />
      </div>
    </div>
  );
}

/** O título de uma seção, com a linha grossa embaixo. */
export function Secao({ titulo, sub, children, id }: { titulo: string; sub?: React.ReactNode; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} style={{ marginBottom: 36, scrollMarginTop: 18 }}>
      <header style={{ borderBottom: borda(), paddingBottom: 10, marginBottom: 18 }}>
        <h2 style={{ fontFamily: FONT_ALFA, fontSize: "clamp(22px, 5.5vw, 30px)", lineHeight: 1.1, margin: sub ? "0 0 6px" : 0 }}>
          {titulo}
        </h2>
        {sub && <p style={{ margin: 0, ...TEXTO.corpo, opacity: 0.85 }}>{sub}</p>}
      </header>
      {children}
    </section>
  );
}

/** O selo quadrado de ícone, o mesmo das fichas de /funcoes. */
export function SeloIcone({ nome }: { nome: IconName }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flex: "0 0 auto",
        width: 44,
        height: 44,
        display: "grid",
        placeItems: "center",
        background: C.gold,
        border: borda(),
        color: C.ink,
      }}
    >
      <Icon name={nome} size={22} />
    </span>
  );
}

/** Botão escuro de ação — o "Quero ser" de /funcoes. */
export function BotaoEscuro({ href, icone = "flag", children, externo }: { href: string; icone?: IconName; children: React.ReactNode; externo?: boolean }) {
  const estilo: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    padding: "11px 18px",
    background: C.ink,
    color: C.gold,
    border: borda(),
    boxShadow: sombra(),
    fontFamily: FONT_ALFA,
    fontSize: 15,
    textDecoration: "none",
    alignSelf: "flex-start",
  };
  return externo ? (
    <a href={href} target="_blank" rel="noopener noreferrer" style={estilo}>
      <Icon name={icone} size={17} />
      {children}
    </a>
  ) : (
    <Link href={href} style={estilo}>
      <Icon name={icone} size={17} />
      {children}
    </Link>
  );
}

/** "17/10" — a data curta da próxima atividade. */
export function dataCurta(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/**
 * O fim de toda página da organização: a porta de entrada. É o mesmo convite
 * nas três, porque a pergunta de quem chegou até aqui é a mesma.
 */
function Convite() {
  return (
    <section
      style={{
        background: C.gold,
        border: borda(),
        boxShadow: sombra("alto"),
        padding: "22px 20px",
        textAlign: "center",
        marginTop: 12,
      }}
    >
      <h2 style={{ fontFamily: FONT_ALFA, fontSize: 22, lineHeight: 1.15, margin: "0 0 10px" }}>
        Quer entrar?
      </h2>
      <p style={{ margin: "0 auto 18px", maxWidth: "46ch", ...TEXTO.corpoSolto }}>
        Deixe seu contato. A coordenação conversa com você em até três dias, te convida para uma
        atividade perto de você e combina uma primeira tarefa pequena.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
        <BotaoEscuro href="/queroajudar">Quero participar</BotaoEscuro>
        <Link
          href="/programacao"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            minHeight: 48,
            padding: "11px 18px",
            background: C.cream,
            color: C.ink,
            border: borda(),
            fontFamily: FONT_ALFA,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          <Icon name="calendar" size={17} />
          Ver a agenda
        </Link>
      </div>
    </section>
  );
}
