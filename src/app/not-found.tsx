import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_ELITE, FONT_BITTER, borda, sombra, sombraErguida, sombraAfundada } from "@/lib/theme";

/* versos de cordel para a página perdida */
const versos = [
  "Andou pelo mundo afora,",
  "por vereda que não há;",
  "a página que procura",
  "se perdeu no meu Ceará.",
];

const NotFound: React.FC = () => {
  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: C.night }}>
      {/* ===== Fundo animado: cena do cordel ===== */}
      <iframe
        src="/cordel-bg.html#bg"
        title="Cena animada de cordel — sertão do Ceará com montanhas, mar e vida da caatinga"
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "fixed",
          inset: 0,
          width: "100%",
          height: "100%",
          border: "0",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      {/* véu escuro pra dar contraste ao conteúdo */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background:
            "linear-gradient(180deg, rgba(12,12,14,.6) 0%, rgba(12,12,14,.28) 40%, rgba(12,12,14,.62) 100%)",
        }}
      />

      {/* ===== Conteúdo ===== */}
      <main
        style={{
          position: "relative",
          zIndex: 2,
          minHeight: "100dvh",
          maxWidth: 560,
          margin: "0 auto",
          padding: "56px 20px 48px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          fontFamily: FONT_BITTER,
          color: C.cream,
        }}
      >
        <p
          style={{
            display: "inline-block",
            fontFamily: FONT_ELITE,
            letterSpacing: 4,
            fontSize: 12,
            textTransform: "uppercase",
            color: C.ink,
            background: C.gold,
            padding: "4px 14px",
            boxShadow: sombra("rente"),
            marginBottom: 18,
          }}
        >
          Página não encontrada
        </p>

        <h1
          style={{
            fontFamily: FONT_ALFA,
            fontSize: "clamp(72px, 22vw, 128px)",
            lineHeight: 0.95,
            letterSpacing: 2,
            color: C.gold,
            textShadow: `4px 4px 0 ${C.ink}`,
            margin: "0 0 6px",
          }}
        >
          404
        </h1>

        {/* versos de cordel */}
        <div
          style={{
            margin: "10px 0 26px",
            padding: "18px 22px",
            background: "rgba(20,17,12,.55)",
            border: `2px solid ${C.ink}`,
            borderRadius: 4,
            backdropFilter: "blur(2px)",
          }}
        >
          {versos.map((v, i) => (
            <p
              key={i}
              style={{
                margin: 0,
                fontSize: "clamp(16px, 4.4vw, 20px)",
                lineHeight: 1.55,
                fontStyle: "italic",
                color: C.cream,
                textShadow: "0 1px 6px rgba(0,0,0,.65)",
              }}
            >
              {v}
            </p>
          ))}
        </div>

        {/* botão de volta — estilo cartão da home */}
        <Link
          href="/"
          className="cordel-card"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 12,
            textDecoration: "none",
            background: C.gold,
            border: borda(),
            boxShadow: sombra(),
            color: C.ink,
            padding: "14px 22px",
            transition: "transform .12s ease, box-shadow .12s ease",
          }}
        >
          <span
            aria-hidden="true"
            style={{
              width: 40,
              height: 40,
              flex: "0 0 auto",
              display: "grid",
              placeItems: "center",
              borderRadius: 8,
              background: C.ink,
              color: C.gold,
              border: `2px solid ${C.ink}`,
            }}
          >
            <Icon name="arrowLeft" size={22} />
          </span>
          <span
            style={{
              fontFamily: FONT_ALFA,
              fontSize: 16,
              letterSpacing: 0.4,
            }}
          >
            Voltar pro começo
          </span>
        </Link>

        <p
          style={{
            fontFamily: FONT_ELITE,
            fontSize: 12,
            letterSpacing: 2,
            color: C.cream,
            opacity: 0.8,
            textShadow: "0 1px 6px rgba(0,0,0,.7)",
            margin: "30px 0 0",
          }}
        >
          @moreiramissao · Missão Ceará
        </p>
      </main>

      {/* hover/press do botão + respeito a reduced-motion */}
      <style>{`
        .cordel-card:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("cartao")} !important; }
        .cordel-card:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("cartao")} !important; }
        .cordel-card:focus-visible { outline: ${BORDA}px solid ${C.gold}; outline-offset: 3px; }
        @media (prefers-reduced-motion: reduce) {
          .cordel-card { transition: none !important; }
        }
      `}</style>
    </div>
  );
};

export default NotFound;
