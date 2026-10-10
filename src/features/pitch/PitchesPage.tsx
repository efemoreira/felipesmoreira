import Link from "next/link";
import { PaginaDoSite } from "@/components/site/PaginaDoSite";
import { PITCHES } from "@/features/pitch/projetos";
import { C, FONT_ALFA, FONT_BITTER, borda, bordaFina, sombra } from "@/lib/theme";

export default function PitchesPage() {
  return (
    <PaginaDoSite>
      <section style={{ padding: "8px 0 20px" }}>
        <p
          style={{
            margin: 0,
            color: C.goldDim,
            fontFamily: FONT_BITTER,
            fontSize: 13,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          Felipe Moreira
        </p>
        <h1
          style={{
            margin: "10px 0 0",
            fontFamily: FONT_ALFA,
            fontSize: "clamp(2.6rem, 5vw, 4.5rem)",
            lineHeight: 1.1,
            color: C.ink,
          }}
        >
          Pitches de projetos
        </h1>
        <p
          style={{
            maxWidth: 760,
            margin: "16px 0 0",
            color: C.ink,
            fontSize: 18,
            lineHeight: 1.6,
          }}
        >
          Ideias em formato de apresentação: cada projeto tem problema, solução, modelo de negócio e o que precisa
          para virar produto real.
        </p>
      </section>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 24,
          marginTop: 18,
        }}
      >
        {PITCHES.map((pitch) => (
          <Link key={pitch.slug} href={`/pitch/${pitch.slug}`} prefetch={false} style={{ textDecoration: "none", color: "inherit" }}>
            <article
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                padding: 20,
                background: C.paper,
                border: borda(pitch.marca.primaria),
                boxShadow: sombra("cartao", C.sombra),
                transition: "transform 0.16s ease, boxShadow 0.16s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: pitch.marca.primaria,
                    color: C.cream,
                    fontFamily: FONT_BITTER,
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {pitch.marca.primaria === "#0F4C5C" ? "Produto" : "Ideia"}
                </span>
                <span style={{ fontFamily: FONT_BITTER, fontSize: 12, color: pitch.marca.primaria }}>Ver pitch</span>
              </div>

              <h2
                style={{
                  margin: "18px 0 8px",
                  fontFamily: FONT_ALFA,
                  fontSize: "clamp(1.9rem, 3vw, 2.5rem)",
                  lineHeight: 1.1,
                  color: pitch.marca.escuro,
                }}
              >
                {pitch.nome}
              </h2>

              <p
                style={{
                  flex: 1,
                  margin: 0,
                  color: C.ink,
                  fontSize: 15.5,
                  lineHeight: 1.6,
                }}
              >
                {pitch.descricao}
              </p>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: bordaFina(pitch.marca.primaria),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  color: pitch.marca.escuro,
                  fontFamily: FONT_BITTER,
                  fontSize: 14,
                }}
              >
                <span>Abre apresentação</span>
                <span aria-hidden="true" style={{ fontSize: 20 }}>→</span>
              </div>
            </article>
          </Link>
        ))}
      </section>
    </PaginaDoSite>
  );
}
