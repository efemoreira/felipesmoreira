'use client';
import React from "react";
import Image from "next/image";
import Link from "next/link";

/* ===== Paleta do cordel (mesma do fundo animado) ===== */
const C = {
  ink: "#181203",
  cream: "#F6F5EF",
  paper: "#F3ECDA",
  gold: "#FFCB05",
  goldDim: "#B8860B",
  night: "#14110C",
};

const profile = {
  name: "Felipe Moreira",
  kicker: "Missão · O Futuro é Glorioso",
  bio: "Do mandacaru ao mar, do Ceará pro Brasil. Acompanhe a missão, a história e as ideias que movem o sertão.",
  photo: "/image/me.png",
};

type LinkCard = {
  icon: string;
  title: string;
  subtitle: string;
  href: string;
  internal?: boolean;
  accent?: boolean;
};

const links: LinkCard[] = [
  {
    icon: "ti-mountain",
    title: "Heróis do Ceará",
    subtitle: "Cordel dos que fizeram nossa história",
    href: "/herois-do-ceara",
    internal: true,
    accent: true,
  },
  {
    icon: "ti-brand-whatsapp",
    title: "WhatsApp",
    subtitle: "Fala direto comigo",
    href: "https://wa.me/5585997223863",
  },
  {
    icon: "ti-mail",
    title: "E-mail",
    subtitle: "contato@felipesmoreira.com",
    href: "mailto:contato@felipesmoreira.com",
  },
];

const Home: React.FC = () => {
  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: C.night }}>
      {/* ===== Fundo animado: cena do cordel (montanhas e barcos fixos, chão parado) ===== */}
      <iframe
        src="/cordel-bg.html#bg"
        title="O Futuro é Glorioso"
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
          fontFamily: "'Bitter', serif",
          color: C.cream,
        }}
      >
        {/* Cabeçalho / perfil */}
        <header style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 152,
              height: 152,
              margin: "0 auto 18px",
              borderRadius: "50%",
              overflow: "hidden",
              background: C.cream,
              boxShadow: `0 0 0 4px ${C.ink}, 0 0 0 8px ${C.gold}, 0 0 0 12px ${C.ink}, 8px 8px 0 rgba(24,18,3,.35)`,
            }}
          >
            <Image
              src={profile.photo}
              alt={profile.name}
              width={152}
              height={152}
              priority
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
          </div>

          <span
            style={{
              display: "inline-block",
              fontFamily: "'Special Elite', monospace",
              letterSpacing: 4,
              fontSize: 12,
              textTransform: "uppercase",
              color: C.ink,
              background: C.gold,
              padding: "4px 14px",
              boxShadow: "3px 3px 0 rgba(24,18,3,.35)",
              marginBottom: 14,
            }}
          >
            {profile.kicker}
          </span>

          <h1
            style={{
              fontFamily: "'Alfa Slab One', serif",
              fontSize: "clamp(30px, 8vw, 46px)",
              letterSpacing: 1,
              lineHeight: 1.05,
              textShadow: `2px 2px 0 ${C.ink}`,
              margin: "6px 0 12px",
            }}
          >
            {profile.name}
          </h1>

          <p
            style={{
              maxWidth: 420,
              margin: "0 auto",
              fontSize: 15.5,
              lineHeight: 1.5,
              color: C.cream,
              textShadow: "0 1px 6px rgba(0,0,0,.65)",
            }}
          >
            {profile.bio}
          </p>
        </header>

        {/* Cartões de links */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {links.map((l) => {
            const content = <CardBody link={l} />;
            const cardStyle: React.CSSProperties = {
              display: "block",
              textDecoration: "none",
              background: l.accent ? C.gold : C.paper,
              border: `3px solid ${C.ink}`,
              boxShadow: `5px 5px 0 rgba(24,18,3,.35)`,
              color: C.ink,
              transition: "transform .12s ease, box-shadow .12s ease",
            };
            return l.internal ? (
              <Link key={l.title} href={l.href} className="cordel-card" style={cardStyle}>
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
              >
                {content}
              </a>
            );
          })}
        </nav>

        {/* Rodapé */}
        <footer style={{ textAlign: "center", marginTop: 34 }}>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
            <a href="https://instagram.com/moreiramissao" target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={socialIcon}>
              <i className="ti ti-brand-instagram" />
            </a>
            <a href="https://x.com/moreiramissao" target="_blank" rel="noopener noreferrer" aria-label="Twitter / X" style={socialIcon}>
              <i className="ti ti-brand-x" />
            </a>
            <a href="https://youtube.com/@moreiramissao" target="_blank" rel="noopener noreferrer" aria-label="YouTube" style={socialIcon}>
              <i className="ti ti-brand-youtube" />
            </a>
            <a href="https://tiktok.com/@moreiramissao" target="_blank" rel="noopener noreferrer" aria-label="TikTok" style={socialIcon}>
              <i className="ti ti-brand-tiktok" />
            </a>
            <a href="https://twitch.tv/moreiramissao" target="_blank" rel="noopener noreferrer" aria-label="Twitch" style={socialIcon}>
              <i className="ti ti-brand-twitch" />
            </a>
            <a href="https://kick.com/moreiramissao" target="_blank" rel="noopener noreferrer" aria-label="Kick" style={socialIcon}>
              <i className="ti ti-brand-kick" />
            </a>
            <a href="https://www.kwai.com/@moreiramissao" target="_blank" rel="noopener noreferrer" aria-label="Kwai" style={socialIcon}>
              <i className="ti ti-video" />
            </a>
          </div>
          <p
            style={{
              fontFamily: "'Special Elite', monospace",
              fontSize: 12,
              letterSpacing: 2,
              color: C.cream,
              opacity: 0.85,
              textShadow: "0 1px 6px rgba(0,0,0,.7)",
            }}
          >
            @moreiramissao · © {new Date().getFullYear()} Felipe Moreira
          </p>
        </footer>
      </main>

      {/* hover/press dos cartões (precisa de CSS global) */}
      <style>{`
        .cordel-card:hover { transform: translate(-2px,-2px); box-shadow: 7px 7px 0 rgba(24,18,3,.4) !important; }
        .cordel-card:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 rgba(24,18,3,.35) !important; }
      `}</style>
    </div>
  );
};

const socialIcon: React.CSSProperties = {
  width: 44,
  height: 44,
  display: "grid",
  placeItems: "center",
  borderRadius: "50%",
  background: C.gold,
  border: `3px solid ${C.ink}`,
  color: C.ink,
  fontSize: 22,
  boxShadow: "3px 3px 0 rgba(24,18,3,.35)",
  textDecoration: "none",
};

const CardBody: React.FC<{ link: LinkCard }> = ({ link }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
    <span
      style={{
        width: 44,
        height: 44,
        flex: "0 0 auto",
        display: "grid",
        placeItems: "center",
        borderRadius: 8,
        background: link.accent ? C.ink : C.gold,
        color: link.accent ? C.gold : C.ink,
        border: `2px solid ${C.ink}`,
        fontSize: 24,
      }}
    >
      <i className={`ti ${link.icon}`} />
    </span>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span
        style={{
          display: "block",
          fontFamily: "'Alfa Slab One', serif",
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
    <i className="ti ti-chevron-right" style={{ fontSize: 20, opacity: 0.6 }} />
  </div>
);

export default Home;
