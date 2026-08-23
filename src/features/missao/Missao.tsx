import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_ELITE, FONT_BITTER, borda, TEXTO } from "@/lib/theme";
import { FaixaEleicao } from "@/components/FaixaEleicao";
import { CARGO, CHAMADA, CHAPA, capitulos, porQueSeguranca } from "./data";

const HATCH =
  "repeating-linear-gradient(88deg, rgba(24,18,3,.045) 0 2px, transparent 2px 15px)," +
  "repeating-linear-gradient(-91deg, rgba(24,18,3,.03) 0 2px, transparent 2px 21px)";

const rotulo: React.CSSProperties = {
  fontFamily: FONT_ELITE,
  fontSize: 11.5,
  letterSpacing: 2.2,
  textTransform: "uppercase",
  opacity: 0.65,
  margin: "0 0 8px",
};

export default function Missao() {
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
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "26px 20px 90px" }}>
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
        <header style={{ margin: "16px 0 36px" }}>
          <div
            style={{
              width: 124,
              height: 124,
              marginBottom: 20,
              borderRadius: "50%",
              overflow: "hidden",
              background: C.cream,
              boxShadow: `0 0 0 4px ${C.ink}, 0 0 0 8px ${C.gold}, 0 0 0 12px ${C.ink}`,
            }}
          >
            <picture>
              <source srcSet="/image/me-320.webp" type="image/webp" />
              <img
                src="/image/me-320.jpg"
                alt="Felipe Moreira"
                width={124}
                height={124}
                decoding="async"
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </picture>
          </div>

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
            Candidato a {CARGO}
          </p>

          <h1
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(32px, 8.5vw, 50px)",
              lineHeight: 1.03,
              letterSpacing: 0.5,
              margin: "0 0 14px",
              textShadow: `3px 3px 0 ${C.gold}`,
              textWrap: "balance",
            }}
          >
            A Missão
          </h1>

          <p style={{ fontSize: 17.5, lineHeight: 1.55, margin: "0 0 22px", maxWidth: "58ch" }}>
            {CHAMADA}
          </p>
          <FaixaEleicao />
        </header>

        {/* ===== a trajetória ===== */}
        <section style={{ marginBottom: 40 }}>
          <p style={rotulo}>Como cheguei aqui</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {capitulos.map((cap) => (
              <article
                key={cap.marco}
                style={{
                  background: C.cream,
                  border: borda(),
                  boxShadow: "6px 6px 0 rgba(24,18,3,.3)",
                  padding: "20px 18px",
                }}
              >
                <header style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <span
                    aria-hidden="true"
                    style={{
                      flex: "0 0 auto",
                      width: 42,
                      height: 42,
                      display: "grid",
                      placeItems: "center",
                      background: C.gold,
                      border: borda(),
                      color: C.ink,
                    }}
                  >
                    <Icon name={cap.icone} size={22} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: FONT_ELITE,
                        fontSize: 11,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        opacity: 0.65,
                        margin: "0 0 2px",
                      }}
                    >
                      {cap.marco}
                    </p>
                    <h2
                      style={{
                        fontFamily: FONT_ALFA,
                        fontSize: "clamp(18px, 4.6vw, 23px)",
                        lineHeight: 1.15,
                        margin: 0,
                        textWrap: "balance",
                      }}
                    >
                      {cap.titulo}
                    </h2>
                  </div>
                </header>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {cap.texto.map((p) => (
                    <p key={p.slice(0, 28)} style={{ margin: 0, fontSize: 16, lineHeight: 1.62 }}>
                      {p}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ===== o que eu vi × o que o plano faz ===== */}
        <section style={{ marginBottom: 36 }}>
          <p style={rotulo}>Por que segurança é o meu eixo</p>
          <p style={{ margin: "0 0 18px", fontSize: 16, lineHeight: 1.62, maxWidth: "60ch" }}>
            Biografia sozinha não governa. Cada coisa que eu vi tem uma linha correspondente no
            plano de governo da chapa — com meta, prazo e de onde vem o dinheiro. É por elas que
            dá pra cobrar.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {porQueSeguranca.map((item) => (
              <div
                key={item.oQueVi}
                style={{
                  background: C.cream,
                  border: borda(),
                  boxShadow: "5px 5px 0 rgba(24,18,3,.28)",
                  padding: "16px 17px",
                }}
              >
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: 16,
                    lineHeight: 1.5,
                    fontWeight: 700,
                    borderLeft: `5px solid ${C.gold}`,
                    paddingLeft: 12,
                  }}
                >
                  {item.oQueVi}
                </p>
                <p style={{ margin: "0 0 10px", ...TEXTO.corpoSolto }}>
                  {item.oQuePlanoFaz}
                </p>
                <Link
                  href={`/propostas#${item.ancora}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    minHeight: 44,
                    fontFamily: FONT_ELITE,
                    fontSize: 12,
                    letterSpacing: 1.2,
                    textTransform: "uppercase",
                    color: C.ink,
                  }}
                >
                  Ver no plano
                  <Icon name="chevronRight" size={15} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ===== a chapa ===== */}
        <section
          style={{
            background: C.ink,
            color: C.cream,
            border: borda(),
            boxShadow: "7px 7px 0 rgba(24,18,3,.3)",
            padding: "22px 20px",
            marginBottom: 34,
          }}
        >
          <h2 style={{ fontFamily: FONT_ALFA, fontSize: 22, lineHeight: 1.15, color: C.gold, margin: "0 0 12px" }}>
            A chapa
          </h2>
          <p style={{ margin: "0 0 14px", fontSize: 16, lineHeight: 1.62 }}>
            <strong>{CHAPA.governador}</strong> é o candidato a governador. Eu sou o vice. O plano
            de governo é o <strong>{CHAPA.plano}</strong>, e vale para os dois — não existe projeto
            do titular e projeto do vice.
          </p>
          <p style={{ margin: "0 0 18px", fontSize: 16, lineHeight: 1.62 }}>
            Uma coisa que confunde muita gente e é bom deixar clara:{" "}
            <strong>vice não tem número de urna próprio</strong>. Quem vota no candidato a
            governador está votando na chapa inteira — nele e em mim, juntos.
          </p>
          <Link
            href="/propostas"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 9,
              minHeight: 48,
              padding: "12px 20px",
              background: C.gold,
              color: C.ink,
              border: borda(C.gold),
              fontFamily: FONT_ALFA,
              fontSize: 15.5,
              textDecoration: "none",
            }}
          >
            <Icon name="book" size={19} />
            Ler o plano de governo
          </Link>
        </section>

        {/* ===== chamada ===== */}
        <section
          style={{
            background: C.gold,
            border: borda(),
            boxShadow: "7px 7px 0 rgba(24,18,3,.3)",
            padding: "22px 20px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontFamily: FONT_ALFA, fontSize: 23, lineHeight: 1.15, margin: "0 0 10px" }}>
            Isso não se faz sozinho
          </h2>
          <p style={{ margin: "0 0 18px", ...TEXTO.corpoSolto }}>
            Tem lugar pra quem tem dez horas por semana e pra quem tem trinta minutos. A
            coordenação conversa com você e te encaixa.
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
              border: borda(),
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
        a:focus-visible { outline: ${BORDA}px solid ${C.ink}; outline-offset: 3px; }
      `}</style>
    </div>
  );
}
