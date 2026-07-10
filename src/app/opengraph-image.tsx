import { ImageResponse } from "next/og";

export const alt = "Felipe Moreira — Missão Ceará · O Futuro é Glorioso";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const dynamic = "force-static";

/* Imagem Open Graph / Twitter (1200×630) — cores do cordel */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(160deg, #14110C 0%, #241C10 55%, #3A2A16 100%)",
          color: "#F6F5EF",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* moldura */}
        <div
          style={{
            position: "absolute",
            inset: 28,
            border: "6px solid #181203",
            boxShadow: "inset 0 0 0 4px #FFCB05",
          }}
        />
        <div
          style={{
            fontSize: 26,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#181203",
            background: "#FFCB05",
            padding: "10px 28px",
            fontWeight: 700,
          }}
        >
          Missão Ceará · O Futuro é Glorioso
        </div>
        <div
          style={{
            fontSize: 104,
            fontWeight: 900,
            marginTop: 28,
            color: "#FFCB05",
            textShadow: "4px 4px 0 #181203",
          }}
        >
          Felipe Moreira
        </div>
        <div
          style={{
            fontSize: 32,
            marginTop: 18,
            maxWidth: 960,
            textAlign: "center",
            color: "#F6F5EF",
            lineHeight: 1.3,
          }}
        >
          De militante de internet a militante de rua.
        </div>
        <div style={{ fontSize: 26, marginTop: 30, color: "#FFDE5A" }}>
          @moreiramissao
        </div>
      </div>
    ),
    { ...size }
  );
}
