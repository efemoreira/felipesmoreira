'use client';
import React from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { BORDA, C, FONT_ALFA, FONT_ELITE, FONT_BITTER, borda, sombra, sombraErguida, sombraAfundada, bordaFina } from "@/lib/theme";
import { marca, coordenacao, links, socialLinks, type LinkCard } from "./data";

export default function Home() {
  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: C.night }}>
      {/* ===== Fundo animado: cena do cordel (montanhas e barcos fixos, chão parado) ===== */}
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
            "linear-gradient(180deg, rgba(12,12,14,.55) 0%, rgba(12,12,14,.18) 26%, rgba(12,12,14,.20) 62%, rgba(12,12,14,.62) 100%)",
        }}
      />

      {/* ===== Conteúdo (estilo link-in-bio, rolando por cima do fundo fixo) ===== */}
      <main
        style={{
          position: "relative",
          zIndex: 2,
          maxWidth: 560,
          margin: "0 auto",
          padding: "56px 20px 40px",
          fontFamily: FONT_BITTER,
          color: C.cream,
        }}
      >
        {/* Cabeçalho: a marca da Missão. O retrato do Felipe desceu para
            "Quem coordena" — depois da eleição, quem chega procura a
            militância, não um candidato. */}
        <header style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 132,
              height: 132,
              margin: "0 auto 18px",
              borderRadius: "50%",
              overflow: "hidden",
              background: C.night,
              boxShadow: `0 0 0 4px ${C.ink}, 0 0 0 8px ${C.gold}, 0 0 0 12px ${C.ink}, ${sombra("alto")}`,
            }}
          >
            {/* <picture> pelo mesmo motivo do retrato: export estático, sem
                next/image — e é ele que diz ao lint que a escolha é nossa. */}
            <picture>
              <img
                src={marca.emblema}
                alt="Marca da Missão: duas onças, uma branca e uma dourada, frente a frente"
                width={132}
                height={132}
                fetchPriority="high"
                decoding="async"
                style={{ objectFit: "cover", width: "100%", height: "100%" }}
              />
            </picture>
          </div>

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
              marginBottom: 14,
            }}
          >
            {marca.kicker}
          </p>

          <h1
            style={{
              fontFamily: FONT_ALFA,
              fontSize: "clamp(30px, 8vw, 46px)",
              letterSpacing: 1,
              lineHeight: 1.05,
              textShadow: `2px 2px 0 ${C.ink}`,
              margin: "6px 0 12px",
            }}
          >
            {marca.nome}
          </h1>

          <p
            style={{
              maxWidth: 440,
              margin: "0 auto",
              fontSize: 15.5,
              lineHeight: 1.5,
              color: C.cream,
              textShadow: "0 1px 6px rgba(0,0,0,.65)",
            }}
          >
            {marca.bio}
          </p>
        </header>

        {/* Cartões de links */}
        <nav
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
          aria-label="Navegação principal"
        >
          {links.map((l) => {
            const content = <CardBody link={l} />;
            const cardStyle: React.CSSProperties = {
              display: "block",
              textDecoration: "none",
              background: l.accent ? C.gold : C.paper,
              border: borda(),
              boxShadow: sombra(),
              color: C.ink,
              transition: "transform .12s ease, box-shadow .12s ease",
            };
            return l.internal ? (
              /* `prefetch={false}`: por padrão o Next baixa o chunk e o payload
                 de todo <Link> visível. Com sete cartões isso são ~239 KB de
                 rotas que o visitante ainda não pediu — medido no 4G lento, mais
                 de um segundo, e dado do bolso de quem está no pré-pago.
                 Num link-in-bio a maioria abre uma página e sai; as rotas são
                 HTML estático e carregam rápido quando alguém realmente clica. */
              <Link
                key={l.title}
                href={l.href}
                prefetch={false}
                className="cordel-card"
                style={cardStyle}
                title={l.description}
              >
                {content}
              </Link>
            ) : (
              <a
                key={l.title}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="cordel-card"
                style={cardStyle}
                title={l.description}
              >
                {content}
              </a>
            );
          })}
        </nav>

        {/* O plano e quem coordena — o conteúdo indexável da home. */}
        <section
          aria-label="O plano da militância"
          style={{
            marginTop: 26,
            padding: "20px 22px",
            background: "rgba(20,17,12,.6)",
            border: bordaFina(C.ink),
            borderRadius: 4,
            backdropFilter: "blur(2px)",
          }}
        >
          <h2
            style={{
              fontFamily: FONT_ALFA,
              fontSize: 20,
              letterSpacing: 0.5,
              color: C.gold,
              margin: "0 0 12px",
            }}
          >
            Da urna à organização permanente
          </h2>
          <div
            style={{
              fontSize: 14.5,
              lineHeight: 1.65,
              color: C.cream,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <p style={{ margin: 0 }}>
              O eleitor da Missão existe no Ceará: <strong>107.587 cearenses</strong> votaram em
              Renan Santos para presidente em 2026. Mas só <strong>18 em cada 100</strong> deles
              votaram também no 14 para deputado federal — no Brasil foram 46. O que faltou não foi
              voto: foi gente organizada para levar esse voto até os nossos nomes.
            </p>
            <p style={{ margin: 0 }}>
              Por isso o próximo ano é de organização: <strong>núcleos</strong> onde o 14 já é
              forte, <strong>grupos temáticos</strong> que estudam e agem,{" "}
              <strong>porta-vozes</strong> que crescem nas redes e na rua, e uma vida cultural
              própria. O que mede o trabalho não é quantos entram na lista — é quantos sobem um
              degrau por mês.
            </p>
          </div>

          {/* Quem coordena. O retrato desceu para cá: depois da eleição o
              Felipe é quem mantém o site e coordena a militância, e a história
              dele continua inteira em /amissao. */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginTop: 18,
              paddingTop: 16,
              borderTop: bordaFina("rgba(255,203,5,.35)"),
            }}
          >
            <picture>
              <source srcSet={coordenacao.photo} type="image/webp" />
              <img
                src={coordenacao.photoReserva}
                alt={`${coordenacao.nome}, coordenador de militância da Missão Ceará`}
                width={72}
                height={72}
                loading="lazy"
                decoding="async"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  objectFit: "cover",
                  boxShadow: `0 0 0 3px ${C.gold}`,
                  flex: "0 0 auto",
                }}
              />
            </picture>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: FONT_ALFA, fontSize: 16, color: C.cream }}>
                {coordenacao.nome}
              </p>
              <p style={{ margin: "2px 0 0", fontSize: 13.5, color: C.cream, opacity: 0.85 }}>
                {coordenacao.papel}
              </p>
              <Link
                href="/amissao"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 7,
                  minHeight: 44,
                  fontFamily: FONT_ELITE,
                  fontSize: 12.5,
                  letterSpacing: 1.4,
                  textTransform: "uppercase",
                  color: C.gold,
                  textDecoration: "none",
                }}
              >
                A história
                <Icon name="chevronRight" size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* Rodapé */}
        <footer style={{ textAlign: "center", marginTop: 34 }}>
          <nav
            style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}
            aria-label="Redes da coordenação"
          >
            {socialLinks.map((s) => (
              <a
                key={s.platform}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`${s.platform} — ${s.handle}`}
                title={`Siga a coordenação no ${s.platform} (${s.handle})`}
                className="cordel-social"
                style={socialIcon}
              >
                <Icon name={s.icon} size={22} />
              </a>
            ))}
          </nav>
          <p
            style={{
              fontFamily: FONT_ELITE,
              fontSize: 12,
              letterSpacing: 2,
              color: C.cream,
              opacity: 0.85,
              textShadow: "0 1px 6px rgba(0,0,0,.7)",
              margin: 0,
            }}
          >
            Missão Ceará · militância · site mantido por Felipe Moreira · ©{" "}
            {new Date().getFullYear()}
          </p>
          {/* A PORTA DE QUEM JÁ É DO MOVIMENTO. Embaixo, discreta, e no site
              público — porque quem tinha conta só achava o painel digitando a
              URL, e "a área do militante não tem link" foi a reclamação que
              chegou. Não é CTA de eleitor: é o caminho de volta de quem já
              entrou. */}
          <nav aria-label="Área do militante" className="cordel-militante-nav">
            <a href="/painel/" className="cordel-militante">
              <Icon name="users" size={16} />
              Área do militante
            </a>
          </nav>
        </footer>
      </main>

      {/* hover/press dos cartões, foco de teclado, entrada suave + respeito a reduced-motion */}
      <style>{`
        .cordel-card:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("cartao")} !important; }
        .cordel-card:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("cartao")} !important; }
        .cordel-social { transition: transform .12s ease, box-shadow .12s ease; }
        .cordel-social:hover { transform: translate(-2px,-2px); box-shadow: ${sombraErguida("rente")}; }
        .cordel-social:active { transform: translate(2px,2px); box-shadow: ${sombraAfundada("rente")}; }
        .cordel-militante-nav {
          display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: center;
          margin-top: 18px; padding: 2px 8px;
          background: rgba(20,17,12,.82); border: ${bordaFina(C.ink)};
        }
        .cordel-militante {
          display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 10px;
          font-family: ${FONT_ELITE}; font-size: 12px; letter-spacing: 2px; text-transform: uppercase;
          color: ${C.gold2}; text-decoration: none;
        }
        .cordel-militante:hover { text-decoration: underline; }
        .cordel-card:focus-visible, .cordel-social:focus-visible { outline: ${BORDA}px solid #FFCB05; outline-offset: 3px; }
        @keyframes cordelIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        main > * { animation: cordelIn .5s ease-out backwards; }
        main > *:nth-child(1) { animation-delay: .05s; }
        main > *:nth-child(2) { animation-delay: .18s; }
        main > *:nth-child(3) { animation-delay: .3s; }
        main > *:nth-child(4) { animation-delay: .42s; }
        @media (prefers-reduced-motion: reduce) {
          .cordel-card, .cordel-social { transition: none !important; }
          main > * { animation: none !important; }
        }
      `}</style>
    </div>
  );
}

const socialIcon: React.CSSProperties = {
  width: 44,
  height: 44,
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  background: C.gold,
  border: borda(),
  color: C.ink,
  boxShadow: sombra("rente"),
  textDecoration: "none",
};

const CardBody: React.FC<{ link: LinkCard }> = ({ link }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
    <span
      aria-hidden="true"
      style={{
        width: 44,
        height: 44,
        flex: "0 0 auto",
        display: "grid",
        placeItems: "center",
        borderRadius: 8,
        background: link.accent ? C.ink : C.gold,
        color: link.accent ? C.gold : C.ink,
        border: bordaFina(C.ink),
      }}
    >
      <Icon name={link.icon} size={24} />
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span
        style={{
          display: "block",
          fontFamily: FONT_ALFA,
          fontSize: 16,
          letterSpacing: 0.4,
          lineHeight: 1.15,
        }}
      >
        {link.title}
      </span>
      <span style={{ display: "block", fontSize: 13, opacity: 0.8, marginTop: 2 }}>
        {link.subtitle}
      </span>
    </span>
    <Icon name="chevronRight" size={20} style={{ opacity: 0.6, flex: "0 0 auto" }} />
  </div>
);

