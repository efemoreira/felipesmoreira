import React from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_ELITE, FONT_BITTER, borda, TEXTO } from "@/lib/theme";
import CATALOGO from "@/data/funcoes.json";
import type { CatalogoFuncoes, Funcao, GrupoFuncao } from "@/features/inscricao/tipos";

/**
 * As 12 funções da militância, em página pública.
 *
 * O texto é o mesmo `funcoes.json` que o formulário usa — **uma fonte só**. A
 * diferença é que aqui ele é indexável e dá pra mandar por link: "olha, tem uma
 * função que é a sua cara" com âncora direta.
 *
 * Cada ficha leva para `/queroajudar?funcao=<id>`, que abre o formulário com
 * ela já marcada. Quem leu a descrição inteira e decidiu não deve ter que
 * procurar de novo numa lista de doze.
 */
const catalogo = CATALOGO as CatalogoFuncoes;

const ORDEM: GrupoFuncao[] = ["comunicacao", "eventos", "outro"];

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

const Ficha: React.FC<{ f: Funcao }> = ({ f }) => (
  <article
    id={f.id}
    style={{
      background: C.cream,
      border: borda(),
      boxShadow: "6px 6px 0 rgba(24,18,3,.3)",
      padding: "20px 18px",
      display: "flex",
      flexDirection: "column",
      gap: 14,
      scrollMarginTop: 18,
    }}
  >
    <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
        <Icon name={f.icone as IconName} size={22} />
      </span>
      <h3
        style={{
          fontFamily: FONT_ALFA,
          fontSize: "clamp(20px, 5vw, 26px)",
          lineHeight: 1.1,
          margin: 0,
          flex: 1,
          minWidth: 0,
        }}
      >
        {f.nome}
      </h3>
    </header>

    <p style={{ margin: 0, fontSize: 16.5, lineHeight: 1.55 }}>{f.resumo}</p>

    <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: 11 }}>
      <div>
        <dt style={rotulo}>O que você entrega</dt>
        <dd style={{ margin: 0, ...TEXTO.corpo }}>{f.entrega}</dd>
      </div>
      <div>
        <dt style={rotulo}>Quanto tempo pede</dt>
        <dd style={{ margin: 0, ...TEXTO.corpo }}>{f.ritmo}</dd>
      </div>
    </dl>

    <details style={{ borderTop: `2px solid rgba(24,18,3,.18)`, paddingTop: 12 }}>
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          minHeight: 44,
          fontFamily: FONT_ELITE,
          fontSize: 12.5,
          letterSpacing: 1.3,
          textTransform: "uppercase",
        }}
      >
        <Icon name="search" size={15} />
        Como se faz, passo a passo
      </summary>
      {/* O preflight do Tailwind (globals.css) zera o marcador de toda lista do
            site. Aqui o número é informação — é um passo a passo, e sem ele a
            ordem some. Onde o marcador não diz nada, deixe o padrão. */}
      <ol style={{ margin: "10px 0 0", paddingLeft: 20, listStyle: "decimal", display: "flex", flexDirection: "column", gap: 7 }}>
        {f.detalhe.map((d) => (
          <li key={d} style={{ ...TEXTO.corpo }}>
            {d}
          </li>
        ))}
      </ol>
    </details>

    <Link
      href={`/queroajudar?funcao=${f.id}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 48,
        padding: "11px 18px",
        background: C.ink,
        color: C.gold,
        border: borda(),
        boxShadow: "4px 4px 0 rgba(24,18,3,.3)",
        fontFamily: FONT_ALFA,
        fontSize: 15,
        textDecoration: "none",
      }}
    >
      <Icon name="flag" size={17} />
      Quero ser {f.nome}
    </Link>
  </article>
);

export default function Funcoes() {
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
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "26px 20px 90px" }}>
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

        <header style={{ margin: "16px 0 32px" }}>
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
            {catalogo.funcoes.length} funções
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
            O que dá pra fazer na militância
          </h1>
          <p style={{ fontSize: 17, lineHeight: 1.55, margin: 0, maxWidth: "58ch" }}>
            Ninguém entra pra “ajudar no que precisar” e descobre depois que não tinha função. Cada
            uma aqui diz o que você entrega e quanto tempo pede — antes de você decidir. Tem lugar
            pra quem tem dez horas por semana e pra quem tem trinta minutos.
          </p>
        </header>

        {ORDEM.map((g) => {
          const doGrupo = catalogo.funcoes.filter((f) => f.grupo === g);
          if (doGrupo.length === 0) return null;
          const info = catalogo.grupos[g];
          return (
            <section key={g} style={{ marginBottom: 36 }}>
              <header style={{ borderBottom: borda(), paddingBottom: 10, marginBottom: 18 }}>
                <h2
                  style={{
                    fontFamily: FONT_ALFA,
                    fontSize: "clamp(22px, 5.5vw, 30px)",
                    lineHeight: 1.1,
                    margin: "0 0 6px",
                  }}
                >
                  {info.nome}
                </h2>
                <p style={{ margin: 0, ...TEXTO.corpo, opacity: 0.85 }}>
                  {info.resumo}
                </p>
              </header>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {doGrupo.map((f) => (
                  <Ficha key={f.id} f={f} />
                ))}
              </div>
            </section>
          );
        })}

        <section
          style={{
            background: C.gold,
            border: borda(),
            boxShadow: "7px 7px 0 rgba(24,18,3,.3)",
            padding: "22px 20px",
            textAlign: "center",
          }}
        >
          <h2 style={{ fontFamily: FONT_ALFA, fontSize: 22, lineHeight: 1.15, margin: "0 0 10px" }}>
            Ainda em dúvida?
          </h2>
          <p style={{ margin: "0 0 18px", ...TEXTO.corpoSolto }}>
            Escolha “Onde precisar”. A coordenação conversa com você e te encaixa — é conversa, não
            formulário.
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
            <Icon name="heartHandshake" size={19} />
            Quero ajudar
          </Link>
        </section>
      </div>

      <style>{`
        summary::-webkit-details-marker { display: none; }
        a:focus-visible, summary:focus-visible { outline: ${BORDA}px solid ${C.ink}; outline-offset: 3px; }
      `}</style>
    </div>
  );
}
