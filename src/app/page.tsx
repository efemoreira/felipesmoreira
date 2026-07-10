'use client';
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon, IconName } from "./icons";

/* ===== Paleta do cordel (mesma do fundo animado) ===== */
const C = {
  ink: "#181203",
  cream: "#F6F5EF",
  paper: "#F3ECDA",
  gold: "#FFCB05",
  goldDim: "#B8860B",
  night: "#14110C",
};

/* Fontes auto-hospedadas via next/font (variáveis definidas no layout) */
const FONT_ALFA = "var(--font-alfa), serif";
const FONT_ELITE = "var(--font-elite), monospace";
const FONT_BITTER = "var(--font-bitter), serif";

const profile = {
  name: "Felipe Moreira",
  kicker: "Missão · O Futuro é Glorioso",
  bio: "De militante de internet a militante de rua. Larguei o conforto de só reclamar pela tela pra abraçar a missão de devolver aos nossos jovens a liberdade que o crime organizado roubou.",
  photo: "/image/me.png",
};

type LinkCard = {
  icon: IconName;
  title: string;
  subtitle: string;
  description: string;
  href: string;
  internal?: boolean;
  accent?: boolean;
};

const links: LinkCard[] = [
  {
    icon: "mountain",
    title: "Heróis do Ceará",
    subtitle: "Cordel dos que fizeram nossa história",
    description:
      "Conheça os heróis históricos do Ceará, suas histórias, legados e impactos na formação cultural do estado",
    href: "/herois-do-ceara",
    internal: true,
    accent: true,
  },
  {
    icon: "whatsapp",
    title: "WhatsApp",
    subtitle: "Fala direto comigo",
    description: "Entre em contato via WhatsApp para conversar sobre a missão e as ideias",
    href: "https://wa.me/5585997223863",
  },
  {
    icon: "mail",
    title: "E-mail",
    subtitle: "contato@felipesmoreira.com",
    description: "Envie um e-mail para contato@felipesmoreira.com com suas mensagens e propostas",
    href: "mailto:contato@felipesmoreira.com",
  },
];

const socialLinks: { platform: string; icon: IconName; url: string; handle: string }[] = [
  { platform: "Instagram", icon: "instagram", url: "https://instagram.com/moreiramissao", handle: "@moreiramissao" },
  { platform: "Twitter / X", icon: "x", url: "https://x.com/moreiramissao", handle: "@moreiramissao" },
  { platform: "YouTube", icon: "youtube", url: "https://youtube.com/@moreiramissao", handle: "@moreiramissao" },
  { platform: "TikTok", icon: "tiktok", url: "https://tiktok.com/@moreiramissao", handle: "@moreiramissao" },
  { platform: "Twitch", icon: "twitch", url: "https://twitch.tv/moreiramissao", handle: "moreiramissao" },
  { platform: "Kick", icon: "kick", url: "https://kick.com/moreiramissao", handle: "moreiramissao" },
  { platform: "Kwai", icon: "video", url: "https://www.kwai.com/@moreiramissao", handle: "@moreiramissao" },
];

const Home: React.FC = () => {
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
              alt={`${profile.name} — ativista político e porta-voz da missão do sertão do Ceará`}
              width={152}
              height={152}
              priority
              style={{ objectFit: "cover", width: "100%", height: "100%" }}
            />
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
              boxShadow: "3px 3px 0 rgba(24,18,3,.35)",
              marginBottom: 14,
            }}
          >
            {profile.kicker}
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
              border: `3px solid ${C.ink}`,
              boxShadow: `5px 5px 0 rgba(24,18,3,.35)`,
              color: C.ink,
              transition: "transform .12s ease, box-shadow .12s ease",
            };
            return l.internal ? (
              <Link
                key={l.title}
                href={l.href}
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

        {/* Minha história — conteúdo indexável e com substância */}
        <section
          aria-label="Minha história e a missão"
          style={{
            marginTop: 26,
            padding: "20px 22px",
            background: "rgba(20,17,12,.6)",
            border: `2px solid ${C.ink}`,
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
            Minha história
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
              Sou <strong>Felipe Moreira</strong>. Durante muito tempo fui militante de internet
              pelo <strong>MBL</strong>, ajudando no que acreditava que podia ajudar.
            </p>
            <p style={{ margin: 0 }}>
              Foi servindo como <strong>líder de jovens na igreja</strong> que enxerguei de perto
              um problema que nenhum post resolve: jovens que não conseguem ir de um lugar a outro
              por medo do <strong>crime organizado</strong> e das disputas entre facções. O medo
              decidindo por onde eles podem ou não andar.
            </p>
            <p style={{ margin: 0 }}>
              Ali entendi que não bastava reclamar, nem agir só pela internet — era preciso fazer
              algo mais. Por isso hoje estou junto da <strong>missão</strong>: para devolver a esses
              jovens a liberdade de ir e vir e um futuro que valha a pena.
            </p>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Conheça também o cordel dos{" "}
              <Link href="/herois-do-ceara" style={{ color: C.gold, textDecoration: "underline" }}>
                Heróis do Ceará
              </Link>{" "}
              e acompanhe o trabalho em{" "}
              <a
                href="https://instagram.com/moreiramissao"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: C.gold, textDecoration: "underline" }}
              >
                @moreiramissao
              </a>
              .
            </p>
          </div>
        </section>

        {/* Rodapé */}
        <footer style={{ textAlign: "center", marginTop: 34 }}>
          <nav
            style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12, marginBottom: 12 }}
            aria-label="Redes sociais"
          >
            {socialLinks.map((s) => (
              <a
                key={s.platform}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer me"
                aria-label={`${s.platform} — ${s.handle}`}
                title={`Siga Felipe Moreira no ${s.platform} (${s.handle})`}
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
            @moreiramissao · © {new Date().getFullYear()} Felipe Moreira
          </p>
        </footer>
      </main>

      {/* hover/press dos cartões + respeito a reduced-motion */}
      <style>{`
        .cordel-card:hover { transform: translate(-2px,-2px); box-shadow: 7px 7px 0 rgba(24,18,3,.4) !important; }
        .cordel-card:active { transform: translate(2px,2px); box-shadow: 2px 2px 0 rgba(24,18,3,.35) !important; }
        @media (prefers-reduced-motion: reduce) {
          .cordel-card { transition: none !important; }
        }
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
  boxShadow: "3px 3px 0 rgba(24,18,3,.35)",
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
        border: `2px solid ${C.ink}`,
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

export default Home;
